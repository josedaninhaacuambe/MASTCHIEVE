import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreateFormacaoDto } from './dto/create-formacao.dto';
import { InscreverFormacaoDto, ActualizarInscricaoDto } from './dto/inscrever-formacao.dto';
import { ConcluirFormacaoDto } from './dto/concluir-formacao.dto';
import {
  ESTADOS_QUE_OCUPAM_VAGA,
  formacaoAceitaInscricoes,
  ocupaVaga,
  resumoVagas,
  contagemPorEstado,
} from './inscricoes.rules';

// Só dados profissionais do colaborador: nada de salário, BI, contactos de emergência.
const FUNCIONARIO_PUBLICO = {
  id: true,
  numeroFuncionario: true,
  firstName: true,
  lastName: true,
  cargo: true,
  departamento: true,
  estado: true,
} as const;

const AUTOR_SELECT = {
  id: true,
  role: true,
  admin: { select: { firstName: true, lastName: true } },
  instructor: { select: { firstName: true, lastName: true } },
  funcionario: { select: { firstName: true, lastName: true } },
} as const;

function nomeDoAutor(u: any): string | null {
  if (!u) return null;
  const p = u.funcionario || u.admin || u.instructor;
  return p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || null : null;
}

function lerJson(s?: string | null) {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

@Injectable()
export class FormacaoService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async findAll(query: any) {
    const where: any = {};
    if (query?.estado) where.estado = String(query.estado);
    if (query?.abertas === '1' || query?.abertas === 'true') where.estado = { in: ['APROVADA_ORCAMENTO', 'EM_CURSO'] };
    const formacoes = await this.prisma.formacao.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        participantes: {
          orderBy: { createdAt: 'asc' },
          include: { funcionario: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    return formacoes.map((f) => {
      const estados = f.participantes.map((p) => p.estado);
      return { ...f, resumo: { ...resumoVagas(f.vagas, estados), porEstado: contagemPorEstado(estados) } };
    });
  }

  async findOne(id: string) {
    const formacao = await this.prisma.formacao.findUnique({
      where: { id },
      include: { participantes: { include: { funcionario: { select: { firstName: true, lastName: true } } } } },
    });
    if (!formacao) throw new NotFoundException('Formação não encontrada');
    return formacao;
  }

  async create(dto: CreateFormacaoDto, actorUserId: string) {
    const formacao = await this.prisma.formacao.create({
      data: {
        ...dto,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : undefined,
        dataFim: dto.dataFim ? new Date(dto.dataFim) : undefined,
        propostoPorId: actorUserId,
      },
    });
    await this.audit.log({
      userId: actorUserId,
      action: 'FORMACAO_PROPOSTA',
      entity: 'Formacao',
      entityId: formacao.id,
      newValues: { titulo: formacao.titulo, vagas: formacao.vagas },
    });
    return formacao;
  }

  async aprovarOrcamento(id: string, actorUserId: string) {
    const formacao = await this.findOne(id);
    if (formacao.estado !== 'PROPOSTA') throw new ConflictException('Formação não está pendente de aprovação de orçamento');
    const updated = await this.prisma.formacao.update({
      where: { id },
      data: { estado: 'APROVADA_ORCAMENTO', aprovadoPorId: actorUserId, aprovadoEm: new Date() },
    });
    await this.audit.log({ userId: actorUserId, action: 'FORMACAO_ORCAMENTO_APROVADO', entity: 'Formacao', entityId: id });
    return updated;
  }

  async rejeitar(id: string, actorUserId: string) {
    await this.findOne(id);
    const updated = await this.prisma.formacao.update({ where: { id }, data: { estado: 'REJEITADA' } });
    await this.audit.log({ userId: actorUserId, action: 'FORMACAO_REJEITADA', entity: 'Formacao', entityId: id });
    return updated;
  }

  /** Altera a capacidade. Não deixa baixar abaixo das vagas já ocupadas. */
  async definirVagas(id: string, vagas: number | null, actorUserId: string) {
    const formacao = await this.findOne(id);
    if (vagas != null) {
      const ocupadas = formacao.participantes.filter((p) => ocupaVaga(p.estado)).length;
      if (vagas < ocupadas) {
        throw new ConflictException(`Já existem ${ocupadas} inscrições activas; a capacidade não pode ser inferior a esse número.`);
      }
    }
    const updated = await this.prisma.formacao.update({ where: { id }, data: { vagas } });
    await this.audit.log({
      userId: actorUserId,
      action: 'FORMACAO_VAGAS_ALTERADAS',
      entity: 'Formacao',
      entityId: id,
      oldValues: { vagas: formacao.vagas },
      newValues: { vagas },
    });
    return updated;
  }

  // ─── Inscrições ───────────────────────────────────────────────────────────

  /**
   * Inscreve (ou reinscreve, se tinha desistido/cancelado) um colaborador.
   * Corre numa transacção com bloqueio da linha da formação para que dois pedidos
   * em simultâneo não ultrapassem as vagas.
   */
  async inscrever(id: string, dto: InscreverFormacaoDto, actorUserId: string) {
    let reactivada = false;
    let inscricao: any;
    try {
      inscricao = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM rh_formacoes WHERE id = ${id} FOR UPDATE`;
        const formacao = await tx.formacao.findUnique({ where: { id } });
        if (!formacao) throw new NotFoundException('Formação não encontrada');
        if (!formacaoAceitaInscricoes(formacao.estado)) {
          throw new ConflictException(
            `A formação não aceita inscrições no estado ${formacao.estado.replace(/_/g, ' ').toLowerCase()}. Só formações com orçamento aprovado ou em curso.`,
          );
        }

        const funcionario = await tx.funcionario.findUnique({ where: { id: dto.funcionarioId }, select: { id: true, estado: true } });
        if (!funcionario) throw new NotFoundException('Colaborador não encontrado');
        if (funcionario.estado === 'DESLIGADO') throw new ConflictException('Este colaborador já não está na organização.');

        const existente = await tx.funcionarioFormacao.findUnique({
          where: { formacaoId_funcionarioId: { formacaoId: id, funcionarioId: dto.funcionarioId } },
        });
        if (existente && ocupaVaga(existente.estado)) {
          throw new ConflictException(
            existente.estado === 'CONCLUIDO'
              ? 'Este colaborador já concluiu esta formação.'
              : 'Este colaborador já está inscrito nesta formação.',
          );
        }

        await this.garantirVaga(tx, formacao.id, formacao.vagas);

        const dados = {
          estado: 'INSCRITO',
          observacoes: dto.observacoes?.trim() || null,
          inscritoPorId: actorUserId,
          canceladoEm: null,
          canceladoPorId: null,
          motivoCancelamento: null,
        };
        if (existente) {
          reactivada = true;
          return tx.funcionarioFormacao.update({ where: { id: existente.id }, data: dados });
        }
        return tx.funcionarioFormacao.create({ data: { formacaoId: id, funcionarioId: dto.funcionarioId, ...dados } });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Este colaborador já está inscrito nesta formação.');
      }
      throw e;
    }
    await this.audit.log({
      userId: actorUserId,
      action: reactivada ? 'FORMACAO_INSCRICAO_REACTIVADA' : 'FORMACAO_INSCRICAO',
      entity: 'FuncionarioFormacao',
      entityId: inscricao.id,
      newValues: { formacaoId: id, funcionarioId: dto.funcionarioId, estado: 'INSCRITO', observacoes: inscricao.observacoes },
    });
    return inscricao;
  }

  private async garantirVaga(tx: Prisma.TransactionClient, formacaoId: string, vagas: number | null) {
    if (vagas == null) return;
    const ocupadas = await tx.funcionarioFormacao.count({
      where: { formacaoId, estado: { in: [...ESTADOS_QUE_OCUPAM_VAGA] } },
    });
    if (ocupadas >= vagas) throw new ConflictException(`Formação esgotada: ${ocupadas} de ${vagas} vagas ocupadas.`);
  }

  private async obterInscricao(inscricaoId: string) {
    const inscricao = await this.prisma.funcionarioFormacao.findUnique({ where: { id: inscricaoId } });
    if (!inscricao) throw new NotFoundException('Inscrição não encontrada');
    return inscricao;
  }

  /** Corrige observações e/ou marca desistência (ou volta a inscrito, se houver vaga). */
  async actualizarInscricao(inscricaoId: string, dto: ActualizarInscricaoDto, actorUserId: string) {
    if (dto.observacoes === undefined && dto.estado === undefined) throw new BadRequestException('Nada para actualizar.');
    const antes = await this.obterInscricao(inscricaoId);
    if (antes.estado === 'CANCELADA') throw new ConflictException('A inscrição está cancelada. Reactive-a primeiro.');
    if (antes.estado === 'CONCLUIDO' && dto.estado) {
      throw new ConflictException('Não é possível alterar o estado de uma formação já concluída.');
    }

    const data: any = {};
    if (dto.observacoes !== undefined) data.observacoes = dto.observacoes.trim() || null;
    if (dto.estado !== undefined) data.estado = dto.estado;

    const depois = await this.prisma.$transaction(async (tx) => {
      if (dto.estado === 'INSCRITO' && antes.estado !== 'INSCRITO') {
        await tx.$queryRaw`SELECT id FROM rh_formacoes WHERE id = ${antes.formacaoId} FOR UPDATE`;
        const formacao = await tx.formacao.findUnique({ where: { id: antes.formacaoId } });
        if (!formacao || !formacaoAceitaInscricoes(formacao.estado)) throw new ConflictException('A formação já não aceita inscrições.');
        await this.garantirVaga(tx, formacao.id, formacao.vagas);
      }
      return tx.funcionarioFormacao.update({ where: { id: inscricaoId }, data });
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'FORMACAO_INSCRICAO_ACTUALIZADA',
      entity: 'FuncionarioFormacao',
      entityId: inscricaoId,
      oldValues: { estado: antes.estado, observacoes: antes.observacoes },
      newValues: { estado: depois.estado, observacoes: depois.observacoes },
    });
    return depois;
  }

  async cancelarInscricao(inscricaoId: string, motivo: string, actorUserId: string) {
    const antes = await this.obterInscricao(inscricaoId);
    if (antes.estado === 'CANCELADA') throw new ConflictException('A inscrição já está cancelada.');
    if (antes.estado === 'CONCLUIDO') throw new ConflictException('Não é possível cancelar uma formação já concluída.');
    // updateMany com o estado anterior evita sobrescrever uma alteração feita entretanto.
    const r = await this.prisma.funcionarioFormacao.updateMany({
      where: { id: inscricaoId, estado: antes.estado },
      data: { estado: 'CANCELADA', canceladoEm: new Date(), canceladoPorId: actorUserId, motivoCancelamento: motivo.trim() },
    });
    if (r.count === 0) throw new ConflictException('A inscrição foi alterada entretanto. Actualize a lista e tente de novo.');
    await this.audit.log({
      userId: actorUserId,
      action: 'FORMACAO_INSCRICAO_CANCELADA',
      entity: 'FuncionarioFormacao',
      entityId: inscricaoId,
      oldValues: { estado: antes.estado },
      newValues: { estado: 'CANCELADA', motivo: motivo.trim() },
    });
    return this.obterInscricao(inscricaoId);
  }

  /** Reactiva uma inscrição cancelada/desistida, respeitando as vagas. */
  async reactivarInscricao(inscricaoId: string, actorUserId: string) {
    const antes = await this.obterInscricao(inscricaoId);
    if (ocupaVaga(antes.estado)) throw new ConflictException('A inscrição já está activa.');
    return this.inscrever(antes.formacaoId, { funcionarioId: antes.funcionarioId, observacoes: antes.observacoes ?? undefined }, actorUserId);
  }

  /** Lista de inscritos de uma formação, com resumo de vagas. */
  async listarInscricoes(formacaoId: string, query: any) {
    const formacao = await this.prisma.formacao.findUnique({
      where: { id: formacaoId },
      select: { id: true, titulo: true, tipo: true, estado: true, vagas: true, local: true, dataInicio: true, dataFim: true },
    });
    if (!formacao) throw new NotFoundException('Formação não encontrada');

    const todas = await this.prisma.funcionarioFormacao.findMany({
      where: { formacaoId },
      orderBy: { createdAt: 'asc' },
      include: { funcionario: { select: FUNCIONARIO_PUBLICO } },
    });
    const estados = todas.map((i) => i.estado);

    const autoresIds = [...new Set(todas.flatMap((i) => [i.inscritoPorId, i.canceladoPorId]).filter(Boolean) as string[])];
    const autores = autoresIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: autoresIds } }, select: AUTOR_SELECT })
      : [];
    const nomes = new Map(autores.map((u) => [u.id, nomeDoAutor(u)]));

    const estado = query?.estado ? String(query.estado) : null;
    const q = query?.q ? String(query.q).trim().toLowerCase() : '';
    const inscricoes = todas
      .filter((i) => !estado || i.estado === estado)
      .filter((i) => {
        if (!q) return true;
        const f = i.funcionario;
        return `${f.firstName} ${f.lastName} ${f.numeroFuncionario}`.toLowerCase().includes(q);
      })
      .map((i) => ({
        ...i,
        inscritoPorNome: i.inscritoPorId ? nomes.get(i.inscritoPorId) ?? null : null,
        canceladoPorNome: i.canceladoPorId ? nomes.get(i.canceladoPorId) ?? null : null,
      }));

    return {
      formacao,
      resumo: { ...resumoVagas(formacao.vagas, estados), porEstado: contagemPorEstado(estados), total: todas.length },
      inscricoes,
    };
  }

  /** Formações em que um colaborador está ou esteve inscrito. */
  async inscricoesDoFuncionario(funcionarioId: string) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { id: funcionarioId }, select: FUNCIONARIO_PUBLICO });
    if (!funcionario) throw new NotFoundException('Colaborador não encontrado');
    const inscricoes = await this.prisma.funcionarioFormacao.findMany({
      where: { funcionarioId },
      orderBy: { createdAt: 'desc' },
      include: { formacao: { select: { id: true, titulo: true, tipo: true, estado: true, dataInicio: true, dataFim: true } } },
    });
    return { funcionario, inscricoes };
  }

  /** Histórico (auditoria) da formação e de todas as suas inscrições. */
  async historico(formacaoId: string) {
    const formacao = await this.prisma.formacao.findUnique({ where: { id: formacaoId }, select: { id: true } });
    if (!formacao) throw new NotFoundException('Formação não encontrada');
    const inscricoes = await this.prisma.funcionarioFormacao.findMany({
      where: { formacaoId },
      select: { id: true, funcionario: { select: { firstName: true, lastName: true } } },
    });
    const nomeColaborador = new Map(inscricoes.map((i) => [i.id, `${i.funcionario.firstName} ${i.funcionario.lastName}`.trim()]));

    const logs = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { entity: 'Formacao', entityId: formacaoId },
          ...(inscricoes.length ? [{ entity: 'FuncionarioFormacao', entityId: { in: inscricoes.map((i) => i.id) } }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: { user: { select: AUTOR_SELECT } },
    });
    return logs.map((l) => ({
      id: l.id,
      action: l.action,
      createdAt: l.createdAt,
      autor: nomeDoAutor(l.user),
      autorRole: l.user?.role ?? null,
      colaborador: l.entity === 'FuncionarioFormacao' && l.entityId ? nomeColaborador.get(l.entityId) ?? null : null,
      antes: lerJson(l.oldValues),
      depois: lerJson(l.newValues),
    }));
  }

  async concluirParticipante(participanteId: string, dto: ConcluirFormacaoDto, actorUserId: string) {
    const participante = await this.prisma.funcionarioFormacao.findUnique({ where: { id: participanteId } });
    if (!participante) throw new NotFoundException('Inscrição não encontrada');
    if (participante.estado !== 'INSCRITO') {
      throw new ConflictException('Só uma inscrição activa pode ser dada como concluída.');
    }

    const updated = await this.prisma.funcionarioFormacao.update({
      where: { id: participanteId },
      data: { estado: 'CONCLUIDO', notaFinal: dto.notaFinal, certificadoUrl: dto.certificadoUrl },
    });
    await this.audit.log({
      userId: actorUserId,
      action: 'FORMACAO_CONCLUIDA',
      entity: 'FuncionarioFormacao',
      entityId: participanteId,
      oldValues: { estado: participante.estado },
      newValues: { estado: 'CONCLUIDO', notaFinal: dto.notaFinal ?? null },
    });
    return updated;
  }
}
