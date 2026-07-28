import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { LancamentoManualDto } from './dto/lancamento-manual.dto';

@Injectable()
export class PresencaAdminService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  findAll(query: any) {
    const where: any = {};
    if (query?.funcionarioId) where.funcionarioId = query.funcionarioId;
    if (query?.unidadeId) where.unidadeId = query.unidadeId;
    if (query?.metodoVerificacao) where.metodoVerificacao = query.metodoVerificacao;
    if (query?.dataInicio || query?.dataFim) {
      where.timestamp = {};
      if (query.dataInicio) where.timestamp.gte = new Date(query.dataInicio);
      if (query.dataFim) where.timestamp.lte = new Date(query.dataFim);
    }
    return this.prisma.registoPresenca.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      include: {
        funcionario: { select: { firstName: true, lastName: true, cargo: true, numeroFuncionario: true } },
        dispositivo: { select: { nome: true } },
        unidade: { select: { nome: true } },
        responsavel: { select: { email: true } },
      },
    });
  }

  async lancarManual(dto: LancamentoManualDto, actorUserId: string) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { id: dto.funcionarioId } });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado');

    const registo = await this.prisma.registoPresenca.create({
      data: {
        funcionarioId: dto.funcionarioId,
        unidadeId: funcionario.unidadeId,
        tipo: dto.tipo,
        metodoVerificacao: 'MANUAL',
        timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
        lancadoManualmente: true,
        responsavelId: actorUserId,
        observacao: dto.observacao,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'PRESENCA_LANCADA_MANUALMENTE',
      entity: 'RegistoPresenca',
      entityId: registo.id,
      newValues: { funcionarioId: dto.funcionarioId, tipo: dto.tipo, observacao: dto.observacao },
    });

    return registo;
  }
}
