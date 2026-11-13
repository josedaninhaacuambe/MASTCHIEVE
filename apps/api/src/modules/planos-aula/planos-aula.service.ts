import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { DIAS_PLANO, GuardarPlanoAulaDto } from './dto/plano-aula.dto';

interface Actor { id: string; role: string }

/** Segunda-feira (UTC, 00:00) da semana da data AAAA-MM-DD. */
export function segundaDaSemana(data: string): Date {
  const [y, m, d] = data.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (isNaN(dt.getTime()) || dt.getUTCDate() !== d) throw new BadRequestException('Data da semana inválida.');
  const diaSemana = (dt.getUTCDay() + 6) % 7; // 0 = segunda
  dt.setUTCDate(dt.getUTCDate() - diaSemana);
  return dt;
}

/** Mantém só os dias conhecidos e textos com tamanho razoável. */
export function limparPartes(partes: GuardarPlanoAulaDto['partes']) {
  return partes.map((p) => {
    const dias: Record<string, string> = {};
    for (const dia of DIAS_PLANO) {
      const v = p.dias?.[dia];
      if (typeof v === 'string' && v.trim()) {
        if (v.length > 1000) throw new BadRequestException(`O texto de ${p.nome} (${dia}) excede 1000 caracteres.`);
        dias[dia] = v.trim();
      }
    }
    return { nome: p.nome.trim(), tempo: p.tempo?.trim() || null, dias };
  });
}

@Injectable()
export class PlanosAulaService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private isAdmin(actor: Actor) {
    return actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN';
  }

  private async instrutorDe(actor: Actor) {
    return this.prisma.instructor.findUnique({ where: { userId: actor.id }, select: { id: true } });
  }

  /** IDs das turmas do instrutor (principal ou auxiliar). null = sem restrição (admin). */
  private async turmasPermitidas(actor: Actor): Promise<string[] | null> {
    if (this.isAdmin(actor)) return null;
    const inst = await this.instrutorDe(actor);
    if (!inst) return [];
    const [principais, auxiliares] = await Promise.all([
      this.prisma.class.findMany({ where: { instructorId: inst.id }, select: { id: true } }),
      this.prisma.classInstructor.findMany({ where: { instructorId: inst.id }, select: { classId: true } }),
    ]);
    return [...new Set([...principais.map((c) => c.id), ...auxiliares.map((c) => c.classId)])];
  }

  private async garantirAcessoTurma(actor: Actor, classId: string) {
    const permitidas = await this.turmasPermitidas(actor);
    if (permitidas && !permitidas.includes(classId)) {
      throw new ForbiddenException('Só pode gerir planos de aula das suas turmas.');
    }
  }

  private normalizar(p: any) {
    let partes: any[] = [];
    try {
      const c = JSON.parse(p.conteudo);
      partes = Array.isArray(c?.partes) ? c.partes : [];
    } catch {
      partes = [];
    }
    const { conteudo: _c, ...resto } = p;
    return { ...resto, semanaInicio: new Date(p.semanaInicio).toISOString().slice(0, 10), partes };
  }

  async turmas(actor: Actor) {
    const permitidas = await this.turmasPermitidas(actor);
    return this.prisma.class.findMany({
      where: { status: 'ACTIVE', ...(permitidas && { id: { in: permitidas } }) },
      select: { id: true, name: true, level: true, schedules: true, instructor: { select: { firstName: true, lastName: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async listar(actor: Actor, q: { classId?: string; semana?: string }) {
    const permitidas = await this.turmasPermitidas(actor);
    if (q.classId && permitidas && !permitidas.includes(q.classId)) return [];
    const where: any = {};
    if (q.classId) where.classId = q.classId;
    else if (permitidas) where.classId = { in: permitidas };
    if (q.semana) where.semanaInicio = segundaDaSemana(q.semana);
    const lista = await this.prisma.planoAula.findMany({
      where,
      orderBy: { semanaInicio: 'desc' },
      take: 100,
      include: {
        class: { select: { id: true, name: true, level: true } },
        instructor: { select: { firstName: true, lastName: true } },
      },
    });
    return lista.map((p) => this.normalizar(p));
  }

  async obter(actor: Actor, id: string) {
    const p = await this.prisma.planoAula.findUnique({
      where: { id },
      include: {
        class: { select: { id: true, name: true, level: true } },
        instructor: { select: { firstName: true, lastName: true } },
      },
    });
    if (!p) throw new NotFoundException('Plano de aula não encontrado');
    await this.garantirAcessoTurma(actor, p.classId);
    return this.normalizar(p);
  }

  /** Cria ou actualiza o plano da turma para essa semana (um plano por turma e semana). */
  async guardar(actor: Actor, dto: GuardarPlanoAulaDto) {
    const turma = await this.prisma.class.findUnique({ where: { id: dto.classId }, select: { id: true } });
    if (!turma) throw new NotFoundException('Turma não encontrada');
    await this.garantirAcessoTurma(actor, dto.classId);

    const semanaInicio = segundaDaSemana(dto.semana);
    const partes = limparPartes(dto.partes);
    const temConteudo = !!dto.objetivoSemana?.trim() || partes.some((p) => Object.keys(p.dias).length > 0);
    if (!temConteudo) throw new BadRequestException('Preencha o objectivo da semana ou pelo menos um exercício.');

    const inst = await this.instrutorDe(actor);
    const dados = {
      nivel: dto.nivel?.trim() || null,
      objetivoSemana: dto.objetivoSemana?.trim() || null,
      conteudo: JSON.stringify({ partes }),
      observacoes: dto.observacoes?.trim() || null,
    };
    const existente = await this.prisma.planoAula.findUnique({
      where: { classId_semanaInicio: { classId: dto.classId, semanaInicio } },
      select: { id: true },
    });
    const plano = await this.prisma.planoAula.upsert({
      where: { classId_semanaInicio: { classId: dto.classId, semanaInicio } },
      create: { classId: dto.classId, semanaInicio, instructorId: inst?.id ?? null, criadoPorId: actor.id, ...dados },
      update: { ...dados, ...(inst && { instructorId: inst.id }) },
      include: {
        class: { select: { id: true, name: true, level: true } },
        instructor: { select: { firstName: true, lastName: true } },
      },
    });
    await this.audit.log({
      userId: actor.id,
      action: existente ? 'PLANO_AULA_ACTUALIZADO' : 'PLANO_AULA_CRIADO',
      entity: 'PlanoAula',
      entityId: plano.id,
      newValues: { classId: dto.classId, semanaInicio: semanaInicio.toISOString().slice(0, 10) },
    });
    return this.normalizar(plano);
  }

  async remover(actor: Actor, id: string) {
    const p = await this.prisma.planoAula.findUnique({ where: { id }, select: { id: true, classId: true, semanaInicio: true } });
    if (!p) throw new NotFoundException('Plano de aula não encontrado');
    await this.garantirAcessoTurma(actor, p.classId);
    await this.prisma.planoAula.delete({ where: { id } });
    await this.audit.log({
      userId: actor.id,
      action: 'PLANO_AULA_REMOVIDO',
      entity: 'PlanoAula',
      entityId: id,
      oldValues: { classId: p.classId, semanaInicio: p.semanaInicio.toISOString().slice(0, 10) },
    });
    return { removido: true };
  }
}
