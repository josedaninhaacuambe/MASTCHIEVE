import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../config/prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly anthropic: Anthropic;
  private readonly model: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    @InjectQueue('feedback') private feedbackQueue: Queue,
    private email: EmailService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get('ANTHROPIC_API_KEY'),
    });
    this.model = this.config.get('ANTHROPIC_MODEL', 'claude-sonnet-4-6');
  }

  async queueFeedbackGeneration(performanceRecordId: string, priority = 5) {
    const job = await this.feedbackQueue.add(
      'generate-feedback',
      { performanceRecordId },
      { priority, delay: 0 },
    );
    this.logger.log(`Feedback job queued: ${job.id}`);
    return { jobId: job.id, status: 'queued' };
  }

  async generateFeedback(performanceRecordId: string): Promise<string> {
    const record = await this.prisma.performanceRecord.findUnique({
      where: { id: performanceRecordId },
      include: {
        feedback: true,
      },
    });

    if (!record) throw new NotFoundException('Performance record not found');

    const student = await this.prisma.student.findUnique({
      where: { id: record.studentId },
      include: {
        progressRecords: { include: { module: true }, take: 5 },
        feedbacks: { take: 3, orderBy: { createdAt: 'desc' } },
        enrollments: {
          where: { isActive: true },
          include: { class: { select: { name: true, level: true } } },
        },
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    const prompt = this.buildFeedbackPrompt(student, record);

    let rawResponse: string;
    let tokensUsed: number;
    try {
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: this.getSystemPrompt(),
        messages: [{ role: 'user', content: prompt }],
      });

      const block = message.content[0];
      if (block.type !== 'text') throw new Error(`Unexpected response block type: ${block.type}`);
      rawResponse = block.text;
      tokensUsed = message.usage.input_tokens + message.usage.output_tokens;
    } catch (err) {
      this.logger.error(`Anthropic call failed for record ${performanceRecordId}`, err instanceof Error ? err.stack : String(err));
      throw new InternalServerErrorException('Falha ao gerar feedback com IA. Tenta novamente mais tarde.');
    }

    // Separate textual feedback from the appended recommendations JSON block.
    const recJsonMatch = rawResponse.match(/\{[\s\S]*\}$/);
    let feedbackText = rawResponse;
    let recommendedLessons: any[] = [];
    let interactiveExercises: any[] = [];

    if (recJsonMatch) {
      const jsonText = recJsonMatch[0];
      feedbackText = rawResponse.replace(jsonText, '').trim();
      try {
        const parsed = JSON.parse(jsonText);
        recommendedLessons = parsed.recommendedLessons || [];
        interactiveExercises = parsed.interactiveExercises || [];
      } catch (err) {
        this.logger.warn('Failed to parse recommendations JSON from AI response');
      }
    }

    // Create or update feedback record (including recommendations)
    await this.prisma.feedback.upsert({
      where: { performanceRecordId },
      create: {
        studentId: student.id,
        performanceRecordId,
        aiGeneratedText: feedbackText,
        status: 'GENERATED',
        aiModel: this.model,
        aiTokensUsed: tokensUsed,
        aiConfidenceScore: this.calculateConfidence(record),
        recommendedLessons: JSON.stringify(recommendedLessons),
        interactiveExercises: JSON.stringify(interactiveExercises),
      },
      update: {
        aiGeneratedText: feedbackText,
        status: 'GENERATED',
        aiModel: this.model,
        aiTokensUsed: tokensUsed,
        aiConfidenceScore: this.calculateConfidence(record),
        recommendedLessons: JSON.stringify(recommendedLessons),
        interactiveExercises: JSON.stringify(interactiveExercises),
        updatedAt: new Date(),
      },
    });

    // Send email notification to student
    const userAccount = await this.prisma.user.findFirst({
      where: { student: { id: student.id } },
      select: { email: true },
    });
    if (userAccount?.email) {
      this.email.sendFeedbackReady(userAccount.email, student.firstName, feedbackText).catch(() => {});
    }

    this.logger.log(`Feedback generated for student ${student.id}, tokens: ${tokensUsed}`);
    return feedbackText;
  }

  async generateTrainingPlan(studentId: string, instructorNotes?: string): Promise<any> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        progressRecords: { include: { module: true } },
        enrollments: {
          where: { isActive: true },
          include: { class: { select: { name: true, level: true } } },
        },
        feedbacks: { take: 5, orderBy: { createdAt: 'desc' }, select: { aiGeneratedText: true } },
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    const level = student.enrollments[0]?.class?.level || 'BEGINNER';

    // Fetch Mastchieve fase progress for richer context
    const studentFases = await this.prisma.studentFase.findMany({
      where: { studentId },
      include: { fase: { select: { nome: true, nivel: true, ordem: true, criterios: true } } },
      orderBy: { fase: { ordem: 'asc' } },
    });
    const faseAtual = studentFases.find(sf => sf.estado === 'EM_PROGRESSO')
      ?? studentFases.filter(sf => sf.estado === 'CONCLUIDO').sort((a, b) => (b.fase?.ordem ?? 0) - (a.fase?.ordem ?? 0))[0];
    const nivelAtual = faseAtual?.fase?.nivel ?? null;
    const faseNome = faseAtual?.fase?.nome ?? null;
    const fasesConcluidas = studentFases.filter(sf => sf.estado === 'CONCLUIDO').map(sf => sf.fase?.nome).filter(Boolean);
    const fasesContext = nivelAtual
      ? `\n**Módulo Pedagógico Mastchieve:** ${nivelAtual} — fase atual: ${faseNome}${fasesConcluidas.length ? `\n**Fases concluídas:** ${fasesConcluidas.join(', ')}` : ''}`
      : '';

    const prompt = `
Cria um plano de treino personalizado para:

**Atleta:** ${student.firstName} ${student.lastName}
**Nível de turma:** ${level}${fasesContext}
**Notas do Instrutor:** ${instructorNotes || 'Nenhuma'}
**Módulos em progresso:** ${student.progressRecords.map((p) => `${p.module.name} (${p.status})`).join(', ') || 'N/A'}

O plano deve ser ALINHADO com a fase pedagógica atual do atleta na metodologia Mastchieve.

Responde com um JSON estruturado assim:
{
  "title": "Título do plano",
  "description": "Descrição geral",
  "objectives": ["Objetivo 1", "Objetivo 2"],
  "exercises": [
    {
      "name": "Nome do exercício",
      "description": "Descrição",
      "duration": "duração em minutos",
      "sets": número,
      "reps": número,
      "notes": "notas adicionais"
    }
  ],
  "weeklyGoal": "Meta semanal",
  "durationWeeks": número
}
    `.trim();

    const message = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: 'És um especialista em natação e pedagogia desportiva da Mastchieve. Responde sempre em português europeu com JSON válido.',
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = (message.content[0] as any).text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const planData = jsonMatch ? JSON.parse(jsonMatch[0]) : { title: 'Plano Personalizado', exercises: [] };

    const plan = await this.prisma.trainingPlan.create({
      data: {
        studentId,
        title: planData.title,
        description: planData.description,
        objectives: planData.objectives || [],
        exercises: planData.exercises || [],
        aiGenerated: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + (planData.durationWeeks || 4) * 7 * 24 * 60 * 60 * 1000),
      },
    });

    return plan;
  }

  private getSystemPrompt(): string {
    return `És o assistente de IA da Mastchieve, especializado em natação e pedagogia desportiva.

O teu papel é gerar feedback personalizado e motivador para atletas após cada aula.

Diretrizes:
- Escreve sempre em português europeu, de forma clara e acessível
- Sê específico e construtivo - menciona aspetos técnicos concretos
- Equilibra pontos positivos com áreas de melhoria
- Adapta o tom à idade e nível do atleta
- Inclui sempre uma nota motivacional no final
- Máximo de 200 palavras no feedback textual
- Além do feedback textual, fornece recomendações de aprendizagem profissionais: aulas/vídeos (YouTube) com links e exercícios interativos com instruções passo-a-passo
- Estrutura do feedback: 1) O que foi bem, 2) Área a melhorar, 3) Objetivo para a próxima aula, 4) Motivação`;
  }

  private buildFeedbackPrompt(student: any, record: any): string {
    const age = Math.floor(
      (Date.now() - new Date(student.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    );
    const level = student.enrollments[0]?.class?.level || 'BEGINNER';

    return `
Gera feedback para a aula de hoje:

**Atleta:** ${student.firstName}, ${age} anos, nível ${level}
**Avaliação da sessão:**
- Técnica: ${record.technique || 'N/A'}/10
- Resistência: ${record.stamina || 'N/A'}/10
- Velocidade: ${record.speed || 'N/A'}/10
- Coordenação: ${record.coordination || 'N/A'}/10
- Respiração: ${record.breathing || 'N/A'}/10
- Viragens: ${record.turns || 'N/A'}/10
- Saída: ${record.startDive || 'N/A'}/10
- Nota global: ${record.overallScore || 'N/A'}/10

**Notas do instrutor:** ${record.instructorNotes || 'Sem notas adicionais'}

Gera um feedback completo e personalizado seguindo as diretrizes.

Adicionalmente, com base no feedback acima, fornece recomendações práticas:

1) Lista 3 aulas/vídeos do YouTube relevantes (título, link, duração aproximada, e uma frase sobre por que o vídeo é útil). Prioriza conteúdos em português quando possível.
2) Lista 3 exercícios interativos práticos (nome, descrição passo-a-passo, sets/reps/duração, objetivos de melhoria), concebidos para melhorar os pontos identificados no feedback.

Responde primeiro com o feedback textual (máx. 200 palavras), seguido por um bloco JSON válido com as chaves "recommendedLessons" e "interactiveExercises" no formato:
{
  "recommendedLessons": [{ "title": "", "url": "", "duration": "", "why": "" }],
  "interactiveExercises": [{ "name": "", "description": "", "sets": 0, "reps": 0, "durationMinutes": 0, "notes": "" }]
}

Mantém o tom profissional e instrutivo. Responde em português europeu.
    `.trim();
  }

  private calculateConfidence(record: any): number {
    const fields = [
      record.technique, record.stamina, record.speed,
      record.coordination, record.breathing, record.turns, record.startDive,
    ];
    const filled = fields.filter((f) => f !== null && f !== undefined).length;
    return filled / fields.length;
  }
}
