import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { EmailService } from '../email/email.service';
import { resolveContactoAtleta } from '../../common/utils/contacto-atleta.util';

const TRANSICOES_ESTADO: Record<string, string[]> = {
  RASCUNHO: ['EM_APROVACAO', 'CANCELADO'],
  EM_APROVACAO: ['APROVADO', 'RASCUNHO', 'CANCELADO'],
  APROVADO: ['PUBLICADO', 'CANCELADO'],
  PUBLICADO: [],
  CANCELADO: [],
};

@Injectable()
export class ComunicacaoService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private whatsapp: WhatsappService,
    private email: EmailService,
  ) {}

  findAll(query: any = {}) {
    const where: any = {};
    if (query.estado) where.estado = query.estado;
    if (query.tipo) where.tipo = query.tipo;
    return this.prisma.pedidoComunicacao.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { solicitante: { select: { email: true } }, aprovadoPor: { select: { email: true } } },
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.pedidoComunicacao.findUnique({ where: { id }, include: { solicitante: true, aprovadoPor: true } });
    if (!p) throw new NotFoundException('Pedido não encontrado');
    return p;
  }

  async create(data: any, solicitanteId: string) {
    const pedido = await this.prisma.pedidoComunicacao.create({ data: { ...data, solicitanteId } });
    await this.audit.log({
      userId: solicitanteId,
      action: 'COMUNICACAO_CRIADA',
      entity: 'PedidoComunicacao',
      entityId: pedido.id,
      newValues: { titulo: pedido.titulo, tipo: pedido.tipo, prioridade: pedido.prioridade },
    });
    return pedido;
  }

  async update(id: string, data: any, actorUserId?: string) {
    const existing = await this.findOne(id);
    if (data.estado && data.estado !== existing.estado) {
      const permitido = TRANSICOES_ESTADO[existing.estado] || [];
      if (!permitido.includes(data.estado)) {
        throw new BadRequestException(`Transição de estado inválida: ${existing.estado} → ${data.estado}`);
      }
    }
    const updated = await this.prisma.pedidoComunicacao.update({ where: { id }, data });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId,
        action: 'COMUNICACAO_ATUALIZADA',
        entity: 'PedidoComunicacao',
        entityId: id,
        oldValues: { estado: existing.estado },
        newValues: { estado: updated.estado },
      });
    }
    return updated;
  }

  async aprovar(id: string, aprovadoPorId: string) {
    const existing = await this.findOne(id);
    if (!(TRANSICOES_ESTADO[existing.estado] || []).includes('APROVADO')) {
      throw new BadRequestException(`Não é possível aprovar um pedido em estado ${existing.estado}`);
    }
    const updated = await this.prisma.pedidoComunicacao.update({
      where: { id }, data: { estado: 'APROVADO', aprovadoPorId, aprovadoEm: new Date() },
    });
    await this.audit.log({
      userId: aprovadoPorId,
      action: 'COMUNICACAO_APROVADA',
      entity: 'PedidoComunicacao',
      entityId: id,
    });
    return updated;
  }

  async publicar(id: string, link: string | undefined, actorUserId: string) {
    const existing = await this.findOne(id);
    if (!(TRANSICOES_ESTADO[existing.estado] || []).includes('PUBLICADO')) {
      throw new BadRequestException(`Não é possível publicar um pedido em estado ${existing.estado}`);
    }
    const updated = await this.prisma.pedidoComunicacao.update({
      where: { id }, data: { estado: 'PUBLICADO', link },
    });
    await this.audit.log({
      userId: actorUserId,
      action: 'COMUNICACAO_PUBLICADA',
      entity: 'PedidoComunicacao',
      entityId: id,
    });
    const enviados = await this.dispatch(updated);
    return { ...updated, enviados };
  }

  private async resolveAudienciaAlunos(publicoAlvo: string) {
    const where: any = { isActive: true };
    if (publicoAlvo?.startsWith('TURMA:')) {
      where.enrollments = { some: { classId: publicoAlvo.slice('TURMA:'.length), isActive: true } };
    } else if (publicoAlvo?.startsWith('UNIDADE:')) {
      where.unidadeId = publicoAlvo.slice('UNIDADE:'.length);
    }
    return this.prisma.student.findMany({
      where,
      include: {
        user: { select: { email: true } },
        parents: { include: { parent: { include: { user: { select: { email: true } } } } } },
      },
    });
  }

  private async dispatch(pedido: { titulo: string; descricao: string; link: string | null; canal: string; publicoAlvo: string }) {
    const alunos = await this.resolveAudienciaAlunos(pedido.publicoAlvo);
    const telefonesEnviados = new Set<string>();
    const emailsEnviados = new Set<string>();
    let totalWhatsapp = 0;
    let totalEmail = 0;

    for (const aluno of alunos) {
      if (pedido.canal === 'WHATSAPP' || pedido.canal === 'AMBOS') {
        const contacto = resolveContactoAtleta(aluno);
        if (contacto.telefone && !telefonesEnviados.has(contacto.telefone)) {
          telefonesEnviados.add(contacto.telefone);
          totalWhatsapp++;
          await this.whatsapp.enqueue({
            tipo: 'COMUNICACAO',
            telefone: contacto.telefone,
            mensagem: [pedido.titulo, pedido.descricao, pedido.link].filter(Boolean).join('\n\n'),
            studentId: aluno.id,
          });
        }
      }

      if (pedido.canal === 'EMAIL' || pedido.canal === 'AMBOS') {
        const primaryParent = aluno.parents.find((p) => p.isPrimary)?.parent ?? aluno.parents[0]?.parent;
        const email = aluno.user?.email || primaryParent?.user?.email;
        if (email && !emailsEnviados.has(email)) {
          emailsEnviados.add(email);
          totalEmail++;
          await this.email.sendComunicacao(email, pedido.titulo, pedido.descricao, pedido.link);
        }
      }
    }

    return { whatsapp: totalWhatsapp, email: totalEmail };
  }

  async createAtendimento(
    data: { studentId?: string; parentId?: string; unidadeId?: string; assunto: string; canal: string; descricao: string; prazoResposta?: string },
    actorUserId: string,
  ) {
    const atendimento = await this.prisma.atendimentoEncarregado.create({
      data: { ...data, atendidoPorId: actorUserId },
    });
    await this.audit.log({
      userId: actorUserId,
      action: 'ATENDIMENTO_CRIADO',
      entity: 'AtendimentoEncarregado',
      entityId: atendimento.id,
      newValues: { assunto: data.assunto, canal: data.canal },
    });
    return atendimento;
  }

  async listAtendimentos(query: { estado?: string; studentId?: string } = {}) {
    return this.prisma.atendimentoEncarregado.findMany({
      where: {
        ...(query.estado ? { estado: query.estado } : {}),
        ...(query.studentId ? { studentId: query.studentId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { firstName: true, lastName: true } },
        parent: { select: { firstName: true, lastName: true } },
        atendidoPor: { select: { email: true } },
      },
    });
  }

  async updateAtendimento(id: string, data: { resposta?: string; estado?: string }, actorUserId: string) {
    const existing = await this.prisma.atendimentoEncarregado.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Atendimento não encontrado');

    const updateData: any = { ...data };
    if (data.estado === 'RESOLVIDO' && existing.estado !== 'RESOLVIDO') {
      updateData.resolvidoEm = new Date();
    }

    const updated = await this.prisma.atendimentoEncarregado.update({ where: { id }, data: updateData });
    await this.audit.log({
      userId: actorUserId,
      action: 'ATENDIMENTO_ATUALIZADO',
      entity: 'AtendimentoEncarregado',
      entityId: id,
      oldValues: { estado: existing.estado },
      newValues: { estado: updated.estado },
    });
    return updated;
  }
}
