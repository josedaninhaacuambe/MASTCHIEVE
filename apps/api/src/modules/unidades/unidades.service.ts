import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { calcularIdade, resolveContactoAtleta } from '../../common/utils/contacto-atleta.util';

function lerJson(s: string | null | undefined): any[] {
  if (!s) return [];
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; }
}

@Injectable()
export class UnidadesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.unidade.findMany({
      orderBy: { nome: 'asc' },
      include: { _count: { select: { turmas: true, estudantes: true, instrutores: true } } },
    });
  }

  async findOne(id: string) {
    const u = await this.prisma.unidade.findUnique({ where: { id } });
    if (!u) throw new NotFoundException('Unidade não encontrada');
    return u;
  }

  create(data: any) {
    return this.prisma.unidade.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.unidade.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.unidade.update({ where: { id }, data: { ativo: false } });
  }

  /**
   * Detalhe da unidade: turmas (horários, módulos, instrutor, ocupação) com os respectivos atletas
   * e os atletas da unidade ainda sem turma. Dados pessoais: só para a gestão da unidade.
   */
  async detalhe(id: string, user: { id: string; role: string }) {
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      const f = await this.prisma.funcionario.findUnique({ where: { userId: user.id }, select: { unidadeId: true } });
      if (!f?.unidadeId || f.unidadeId !== id) throw new ForbiddenException('Só pode ver o detalhe da sua unidade.');
    }
    const unidade = await this.findOne(id);
    const alunoSelect = {
      id: true, firstName: true, lastName: true, dateOfBirth: true, gender: true, phone: true, emergencyPhone: true,
      isActive: true, estadoInscricao: true, etiqueta: true, trabalhadorBm: true,
      pacote: { select: { nome: true } },
      parents: { select: { isPrimary: true, parent: { select: { phone: true, firstName: true, lastName: true } } } },
      studentFases: { where: { estado: 'EM_PROGRESSO' }, select: { fase: { select: { nome: true } } } },
    } as const;

    const [turmas, semTurma, fases] = await Promise.all([
      this.prisma.class.findMany({
        where: { unidadeId: id },
        orderBy: { name: 'asc' },
        select: {
          id: true, name: true, level: true, status: true, maxStudents: true, poolLane: true, schedules: true, moduleIds: true,
          instructor: { select: { firstName: true, lastName: true } },
          enrollments: { where: { isActive: true }, select: { enrolledAt: true, student: { select: alunoSelect } } },
        },
      }),
      this.prisma.student.findMany({
        where: { unidadeId: id, isActive: true, enrollments: { none: { isActive: true } } },
        orderBy: { firstName: 'asc' },
        select: alunoSelect,
      }),
      this.prisma.faseProgressao.findMany({ select: { id: true, nome: true } }),
    ]);
    const nomeFase = new Map(fases.map((f) => [f.id, f.nome]));

    const aluno = (s: any) => ({
      id: s.id,
      nome: `${s.firstName} ${s.lastName}`.trim(),
      idade: s.dateOfBirth ? calcularIdade(new Date(s.dateOfBirth)) : null,
      genero: s.gender,
      contacto: resolveContactoAtleta(s).telefone,
      isActive: s.isActive,
      estadoInscricao: s.estadoInscricao,
      etiqueta: s.etiqueta,
      trabalhadorBm: s.trabalhadorBm,
      pacote: s.pacote?.nome ?? null,
      moduloEmCurso: s.studentFases?.[0]?.fase?.nome ?? null,
    });

    return {
      unidade,
      totais: {
        turmas: turmas.length,
        atletasEmTurmas: new Set(turmas.flatMap((t) => t.enrollments.map((e) => e.student.id))).size,
        semTurma: semTurma.length,
        bm: [...turmas.flatMap((t) => t.enrollments.map((e) => e.student)), ...semTurma].filter((s, i, arr) => s.etiqueta === 'BM' && arr.findIndex((x) => x.id === s.id) === i).length,
      },
      turmas: turmas.map((t) => ({
        id: t.id,
        nome: t.name,
        nivel: t.level,
        estado: t.status,
        capacidade: t.maxStudents,
        ocupacao: t.enrollments.length,
        pista: t.poolLane,
        horarios: lerJson(t.schedules),
        modulos: lerJson(t.moduleIds).map((m: string) => nomeFase.get(m)).filter(Boolean),
        instrutor: t.instructor ? `${t.instructor.firstName} ${t.instructor.lastName}`.trim() : null,
        atletas: t.enrollments.map((e) => aluno(e.student)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt')),
      })),
      semTurma: semTurma.map(aluno),
    };
  }

  async stats(id: string) {
    const [turmas, estudantes, leads, incidentes] = await Promise.all([
      this.prisma.class.count({ where: { unidadeId: id } }),
      this.prisma.student.count({ where: { unidadeId: id, isActive: true } }),
      this.prisma.lead.count({ where: { unidadeId: id } }),
      this.prisma.incidente.count({ where: { unidadeId: id } }),
    ]);
    return { turmas, estudantes, leads, incidentes };
  }
}
