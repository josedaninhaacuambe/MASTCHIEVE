import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreateFormacaoDto } from './dto/create-formacao.dto';
import { InscreverFormacaoDto } from './dto/inscrever-formacao.dto';
import { ConcluirFormacaoDto } from './dto/concluir-formacao.dto';

@Injectable()
export class FormacaoService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  findAll(query: any) {
    const where: any = {};
    if (query?.estado) where.estado = query.estado;
    return this.prisma.formacao.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { participantes: { include: { funcionario: { select: { firstName: true, lastName: true } } } } },
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
    await this.audit.log({ userId: actorUserId, action: 'FORMACAO_PROPOSTA', entity: 'Formacao', entityId: formacao.id });
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

  async inscrever(id: string, dto: InscreverFormacaoDto, actorUserId: string) {
    await this.findOne(id);
    const funcionario = await this.prisma.funcionario.findUnique({ where: { id: dto.funcionarioId } });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado');

    const inscricao = await this.prisma.funcionarioFormacao.create({
      data: { formacaoId: id, funcionarioId: dto.funcionarioId },
    });
    await this.audit.log({ userId: actorUserId, action: 'FORMACAO_INSCRICAO', entity: 'FuncionarioFormacao', entityId: inscricao.id });
    return inscricao;
  }

  async concluirParticipante(participanteId: string, dto: ConcluirFormacaoDto, actorUserId: string) {
    const participante = await this.prisma.funcionarioFormacao.findUnique({ where: { id: participanteId } });
    if (!participante) throw new NotFoundException('Inscrição não encontrada');

    const updated = await this.prisma.funcionarioFormacao.update({
      where: { id: participanteId },
      data: { estado: 'CONCLUIDO', notaFinal: dto.notaFinal, certificadoUrl: dto.certificadoUrl },
    });
    await this.audit.log({ userId: actorUserId, action: 'FORMACAO_CONCLUIDA', entity: 'FuncionarioFormacao', entityId: participanteId });
    return updated;
  }
}
