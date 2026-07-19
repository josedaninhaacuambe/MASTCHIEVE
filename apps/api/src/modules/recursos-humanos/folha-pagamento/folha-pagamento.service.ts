import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreateFolhaPagamentoDto } from './dto/create-folha-pagamento.dto';

@Injectable()
export class FolhaPagamentoService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  findAll(query: any) {
    const where: any = {};
    if (query?.funcionarioId) where.funcionarioId = query.funcionarioId;
    if (query?.estado) where.estado = query.estado;
    if (query?.mes) where.mes = parseInt(query.mes);
    if (query?.ano) where.ano = parseInt(query.ano);
    return this.prisma.folhaPagamento.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
      include: { funcionario: { select: { firstName: true, lastName: true } } },
    });
  }

  async findOne(id: string) {
    const folha = await this.prisma.folhaPagamento.findUnique({ where: { id } });
    if (!folha) throw new NotFoundException('Folha de pagamento não encontrada');
    return folha;
  }

  async create(dto: CreateFolhaPagamentoDto, actorUserId: string) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { id: dto.funcionarioId } });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado');

    const existente = await this.prisma.folhaPagamento.findUnique({
      where: { funcionarioId_mes_ano: { funcionarioId: dto.funcionarioId, mes: dto.mes, ano: dto.ano } },
    });
    if (existente) throw new ConflictException('Já existe folha de pagamento para este funcionário neste mês/ano');

    const premios = dto.premios || 0;
    const descontos = dto.descontos || 0;
    const horasExtras = dto.horasExtras || 0;
    const valorLiquido = dto.salarioBase + premios + horasExtras - descontos;

    const folha = await this.prisma.folhaPagamento.create({
      data: {
        ...dto,
        premios,
        descontos,
        horasExtras,
        valorLiquido,
        processadoPorId: actorUserId,
        estado: 'PENDENTE_APROVACAO',
      },
    });
    await this.audit.log({ userId: actorUserId, action: 'FOLHA_PAGAMENTO_PROCESSADA', entity: 'FolhaPagamento', entityId: folha.id });
    return folha;
  }

  async aprovar(id: string, actorUserId: string) {
    const folha = await this.findOne(id);
    if (folha.estado !== 'PENDENTE_APROVACAO') throw new ConflictException('Folha não está pendente de aprovação');
    const updated = await this.prisma.folhaPagamento.update({
      where: { id },
      data: { estado: 'APROVADA', aprovadoPorId: actorUserId, aprovadoEm: new Date() },
    });
    await this.audit.log({ userId: actorUserId, action: 'FOLHA_PAGAMENTO_APROVADA', entity: 'FolhaPagamento', entityId: id });
    return updated;
  }

  async rejeitar(id: string, actorUserId: string) {
    await this.findOne(id);
    const updated = await this.prisma.folhaPagamento.update({ where: { id }, data: { estado: 'REJEITADA' } });
    await this.audit.log({ userId: actorUserId, action: 'FOLHA_PAGAMENTO_REJEITADA', entity: 'FolhaPagamento', entityId: id });
    return updated;
  }

  async marcarPaga(id: string, actorUserId: string) {
    const folha = await this.findOne(id);
    if (folha.estado !== 'APROVADA') throw new ConflictException('Folha precisa estar aprovada antes de ser marcada como paga');
    const updated = await this.prisma.folhaPagamento.update({ where: { id }, data: { estado: 'PAGA', pagoEm: new Date() } });
    await this.audit.log({ userId: actorUserId, action: 'FOLHA_PAGAMENTO_PAGA', entity: 'FolhaPagamento', entityId: id });
    return updated;
  }
}
