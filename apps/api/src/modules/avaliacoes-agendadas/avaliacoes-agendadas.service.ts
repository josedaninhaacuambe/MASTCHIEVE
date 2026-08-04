import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AvaliacoesService } from '../avaliacoes/avaliacoes.service';
import { CreateAvaliacaoAgendadaDto } from './dto/create-avaliacao-agendada.dto';
import { SubmitResultadoDto } from './dto/submit-resultado.dto';

interface AuthUser {
  id: string;
  role: string;
}

@Injectable()
export class AvaliacoesAgendadasService {
  constructor(
    private prisma: PrismaService,
    private avaliacoesService: AvaliacoesService,
  ) {}

  private resolveInstructor(userId: string) {
    return this.prisma.instructor.findUnique({ where: { userId } });
  }

  private async assertOwnership(sessao: { instructorId: string }, user: AuthUser) {
    if (user.role === 'INSTRUCTOR') {
      const instructor = await this.resolveInstructor(user.id);
      if (!instructor || instructor.id !== sessao.instructorId) {
        throw new ForbiddenException('Sem permissão para gerir esta sessão de avaliação');
      }
    }
  }

  async create(dto: CreateAvaliacaoAgendadaDto, user: AuthUser) {
    const cls = await this.prisma.class.findUnique({ where: { id: dto.classId } });
    if (!cls) throw new NotFoundException('Turma não encontrada');

    if (user.role === 'INSTRUCTOR') {
      const instructor = await this.resolveInstructor(user.id);
      if (!instructor || instructor.id !== cls.instructorId) {
        throw new ForbiddenException('Só pode agendar avaliações para as suas próprias turmas');
      }
    }

    return this.prisma.avaliacaoAgendada.create({
      data: {
        classId: dto.classId,
        instructorId: cls.instructorId,
        data: new Date(dto.data),
        observacoes: dto.observacoes,
      },
    });
  }

  async findAll(user: AuthUser) {
    const where: { instructorId?: string } = {};
    if (user.role === 'INSTRUCTOR') {
      const instructor = await this.resolveInstructor(user.id);
      where.instructorId = instructor?.id ?? '__none__';
    }

    return this.prisma.avaliacaoAgendada.findMany({
      where,
      orderBy: { data: 'desc' },
      include: {
        class: { select: { id: true, name: true, _count: { select: { enrollments: { where: { isActive: true } } } } } },
        instructor: { select: { firstName: true, lastName: true } },
        _count: { select: { resultados: true } },
      },
    });
  }

  private async findSessaoOrThrow(id: string) {
    const sessao = await this.prisma.avaliacaoAgendada.findUnique({ where: { id } });
    if (!sessao) throw new NotFoundException('Sessão de avaliação não encontrada');
    return sessao;
  }

  async getRoster(id: string, user: AuthUser) {
    const sessao = await this.findSessaoOrThrow(id);
    await this.assertOwnership(sessao, user);

    const [enrollments, resultados] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { classId: sessao.classId, isActive: true },
        include: { student: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      }),
      this.prisma.avaliacao.findMany({ where: { sessaoAgendadaId: id } }),
    ]);

    const roster = await Promise.all(
      enrollments.map(async e => {
        const studentFase = await this.prisma.studentFase.findFirst({
          where: { studentId: e.studentId, estado: 'EM_PROGRESSO' },
          include: { fase: { select: { id: true, nome: true, nivel: true, ordem: true } } },
        });
        const resultado = resultados.find(r => r.studentId === e.studentId);
        return {
          student: e.student,
          moduloAtivo: studentFase?.fase ?? null,
          studentFaseId: studentFase?.id ?? null,
          resultado: resultado
            ? { aprovado: resultado.aprovado, avaliadoEm: resultado.avaliadoEm, motivoReprovacao: resultado.motivoReprovacao }
            : null,
        };
      }),
    );

    return { sessao, roster };
  }

  async submitResultado(id: string, studentId: string, dto: SubmitResultadoDto, user: AuthUser) {
    const sessao = await this.findSessaoOrThrow(id);
    await this.assertOwnership(sessao, user);

    const existing = await this.prisma.avaliacao.findUnique({
      where: { sessaoAgendadaId_studentId: { sessaoAgendadaId: id, studentId } },
    });
    if (existing) throw new ConflictException('Este aluno já foi avaliado nesta sessão');

    const { aprovado, motivoReprovacao, avaliacao } = await this.avaliacoesService.registrarAvaliacao(
      { tipo: 'AGENDADA', sessaoAgendadaId: id, studentId, avaliacoes: dto.avaliacoes },
      user,
    );

    if (sessao.estado === 'AGENDADA') {
      await this.prisma.avaliacaoAgendada.update({ where: { id }, data: { estado: 'EM_ANDAMENTO' } });
    }

    return { aprovado, motivoReprovacao, resultado: avaliacao };
  }

  async findMineAsStudent(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Perfil de atleta não encontrado');

    return this.prisma.avaliacao.findMany({
      where: { studentId: student.id, tipo: 'AGENDADA' },
      orderBy: { avaliadoEm: 'desc' },
      include: { studentFase: { include: { fase: { select: { nome: true, nivel: true, ordem: true } } } } },
    });
  }
}
