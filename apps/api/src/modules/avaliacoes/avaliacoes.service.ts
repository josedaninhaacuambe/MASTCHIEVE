import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { avaliarRegraConclusao } from '../fases/regra-conclusao.util';
import { RegistrarAvaliacaoDto } from './dto/registrar-avaliacao.dto';

interface AuthUser {
  id: string;
  role: string;
}

// Serviço único de pontuação, partilhado pela avaliação DIÁRIA (por aula, gera
// feedback IA, nunca transita módulo) e pela avaliação AGENDADA (sessão formal
// por turma, decide a transição de módulo) — ver Avaliacao no schema.prisma.
@Injectable()
export class AvaliacoesService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  private async resolveInstructorId(user: AuthUser): Promise<string | undefined> {
    if (user.role !== 'INSTRUCTOR') return undefined;
    const instructor = await this.prisma.instructor.findUnique({ where: { userId: user.id } });
    return instructor?.id;
  }

  async getModuloAtivo(studentId: string) {
    const studentFase = await this.prisma.studentFase.findFirst({
      where: { studentId, estado: 'EM_PROGRESSO' },
      include: { fase: true },
    });
    if (!studentFase) throw new NotFoundException('Aluno não tem módulo em progresso para avaliar');

    return {
      studentFaseId: studentFase.id,
      moduloAtivo: {
        id: studentFase.fase.id,
        nome: studentFase.fase.nome,
        nivel: studentFase.fase.nivel,
        ordem: studentFase.fase.ordem,
      },
      criterios: JSON.parse(studentFase.fase.criterios),
      totalMinimo: studentFase.fase.totalMinimo,
    };
  }

  async registrarAvaliacao(dto: RegistrarAvaliacaoDto, user: AuthUser) {
    const studentFase = await this.prisma.studentFase.findFirst({
      where: { studentId: dto.studentId, estado: 'EM_PROGRESSO' },
      include: { fase: true },
    });
    if (!studentFase) throw new BadRequestException('Aluno não tem módulo em progresso para avaliar');

    const criterios: { nome: string; obrigatoria: boolean }[] = JSON.parse(studentFase.fase.criterios);
    const avaliacoes = dto.avaliacoes.map(a => ({ criterioIndex: a.criterioIndex, valor: a.valor }));
    const resultado = avaliarRegraConclusao(criterios, studentFase.fase.totalMinimo, avaliacoes);

    await this.prisma.$transaction(
      dto.avaliacoes.map(a =>
        this.prisma.studentFaseCriterio.upsert({
          where: { studentFaseId_criterioIndex: { studentFaseId: studentFase.id, criterioIndex: a.criterioIndex } },
          update: { valor: a.valor },
          create: { studentFaseId: studentFase.id, criterioIndex: a.criterioIndex, valor: a.valor },
        }),
      ),
    );

    const pontuacoes = criterios.map((c, index) => {
      const av = avaliacoes.find(a => a.criterioIndex === index);
      return { criterioIndex: index, nome: c.nome, obrigatoria: c.obrigatoria, valor: av?.valor ?? null, minimo: c.obrigatoria ? 4 : 3 };
    });

    let motivoReprovacao: string | undefined;
    if (!resultado.aprovado) {
      const partes: string[] = [];
      if (resultado.criteriosFaltando.length > 0) {
        partes.push(`Faltam pontuações para: ${resultado.criteriosFaltando.join(', ')}`);
      }
      if (resultado.criteriosAbaixoMinimo.length > 0) {
        partes.push(
          `Habilidades abaixo do mínimo exigido: ${resultado.criteriosAbaixoMinimo.map(({ nome, valor, minimo }) => `${nome} (${valor}, mín. ${minimo})`).join(', ')}`,
        );
      }
      if (resultado.criteriosFaltando.length === 0 && resultado.criteriosAbaixoMinimo.length === 0 && resultado.soma < resultado.totalMinimo) {
        partes.push(`Pontuação total (${resultado.soma}) abaixo do mínimo exigido (${resultado.totalMinimo})`);
      }
      motivoReprovacao = partes.join(' | ');
    }

    const avaliadoPorId = await this.resolveInstructorId(user);
    const notaGlobal = Math.round((resultado.soma / (Math.max(criterios.length, 1) * 5)) * 1000) / 100;

    const avaliacao = await this.prisma.avaliacao.create({
      data: {
        tipo: dto.tipo,
        sessaoAgendadaId: dto.tipo === 'AGENDADA' ? dto.sessaoAgendadaId : undefined,
        classSessionId: dto.classSessionId,
        studentId: dto.studentId,
        studentFaseId: studentFase.id,
        pontuacoes: JSON.stringify(pontuacoes),
        soma: resultado.soma,
        totalMinimoSnapshot: resultado.totalMinimo,
        notaGlobal,
        aprovado: resultado.aprovado,
        motivoReprovacao,
        observacoes: dto.observacoes,
        avaliadoPorId,
      },
    });

    // Só a avaliação AGENDADA aciona a transição de módulo — a DIÁRIA nunca aprova/reprova.
    if (dto.tipo === 'AGENDADA' && resultado.aprovado) {
      await this.prisma.studentFase.update({
        where: { id: studentFase.id },
        data: { estado: 'CONCLUIDO', concluidoEm: new Date() },
      });
    }

    if (dto.tipo === 'DIARIA') {
      await this.prisma.feedback.create({
        data: {
          studentId: dto.studentId,
          sessionId: dto.classSessionId,
          instructorId: avaliadoPorId,
          avaliacaoId: avaliacao.id,
          status: 'PENDING',
          recommendedLessons: '[]',
          interactiveExercises: '[]',
        },
      });

      try {
        await this.aiService.queueFeedbackGeneration({ avaliacaoId: avaliacao.id });
      } catch (e) {
        // Fila indisponível (Redis em baixo) — avaliação e feedback base ficam guardados, geração de IA fica pendente
      }
    }

    return { aprovado: resultado.aprovado, motivoReprovacao, notaGlobal, avaliacao };
  }

  async getAvaliadosNaSessao(classSessionId: string) {
    const avaliacoes = await this.prisma.avaliacao.findMany({
      where: { classSessionId },
      select: { studentId: true },
    });
    return { studentIds: [...new Set(avaliacoes.map(a => a.studentId))] };
  }

  async findMineAsStudent(userId: string, tipo?: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Perfil de atleta não encontrado');

    return this.prisma.avaliacao.findMany({
      where: { studentId: student.id, ...(tipo && { tipo }) },
      orderBy: { avaliadoEm: 'desc' },
      include: { studentFase: { include: { fase: { select: { nome: true, nivel: true, ordem: true } } } } },
    });
  }
}
