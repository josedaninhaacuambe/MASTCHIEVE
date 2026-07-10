"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bull_1 = require("@nestjs/bull");
const sdk_1 = require("@anthropic-ai/sdk");
const prisma_service_1 = require("../../config/prisma/prisma.service");
let AiService = AiService_1 = class AiService {
    constructor(config, prisma, feedbackQueue) {
        this.config = config;
        this.prisma = prisma;
        this.feedbackQueue = feedbackQueue;
        this.logger = new common_1.Logger(AiService_1.name);
        this.anthropic = new sdk_1.default({
            apiKey: this.config.get('ANTHROPIC_API_KEY'),
        });
        this.model = this.config.get('ANTHROPIC_MODEL', 'claude-sonnet-4-6');
    }
    async queueFeedbackGeneration(performanceRecordId, priority = 5) {
        const job = await this.feedbackQueue.add('generate-feedback', { performanceRecordId }, { priority, delay: 0 });
        this.logger.log(`Feedback job queued: ${job.id}`);
        return { jobId: job.id, status: 'queued' };
    }
    async generateFeedback(performanceRecordId) {
        const record = await this.prisma.performanceRecord.findUnique({
            where: { id: performanceRecordId },
            include: {
                feedback: true,
            },
        });
        if (!record)
            throw new Error('Performance record not found');
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
        if (!student)
            throw new Error('Student not found');
        const prompt = this.buildFeedbackPrompt(student, record);
        const message = await this.anthropic.messages.create({
            model: this.model,
            max_tokens: 1024,
            system: this.getSystemPrompt(),
            messages: [{ role: 'user', content: prompt }],
        });
        const rawResponse = message.content[0].text;
        const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;
        const recJsonMatch = rawResponse.match(/\{[\s\S]*\}$/);
        let feedbackText = rawResponse;
        let recommendedLessons = [];
        let interactiveExercises = [];
        if (recJsonMatch) {
            const jsonText = recJsonMatch[0];
            feedbackText = rawResponse.replace(jsonText, '').trim();
            try {
                const parsed = JSON.parse(jsonText);
                recommendedLessons = parsed.recommendedLessons || [];
                interactiveExercises = parsed.interactiveExercises || [];
            }
            catch (err) {
                this.logger.warn('Failed to parse recommendations JSON from AI response');
            }
        }
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
        this.logger.log(`Feedback generated for student ${student.id}, tokens: ${tokensUsed}`);
        return feedbackText;
    }
    async generateTrainingPlan(studentId, instructorNotes) {
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
        if (!student)
            throw new Error('Student not found');
        const level = student.enrollments[0]?.class?.level || 'BEGINNER';
        const prompt = `
Cria um plano de treino personalizado para:

**Atleta:** ${student.firstName} ${student.lastName}
**Nível:** ${level}
**Notas do Instrutor:** ${instructorNotes || 'Nenhuma'}
**Módulos em progresso:** ${student.progressRecords.map((p) => `${p.module.name} (${p.status})`).join(', ') || 'N/A'}

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
        const responseText = message.content[0].text;
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
    getSystemPrompt() {
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
    buildFeedbackPrompt(student, record) {
        const age = Math.floor((Date.now() - new Date(student.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
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
    calculateConfidence(record) {
        const fields = [
            record.technique, record.stamina, record.speed,
            record.coordination, record.breathing, record.turns, record.startDive,
        ];
        const filled = fields.filter((f) => f !== null && f !== undefined).length;
        return filled / fields.length;
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bull_1.InjectQueue)('feedback')),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService, Object])
], AiService);
//# sourceMappingURL=ai.service.js.map