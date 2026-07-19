import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreateDesligamentoDto } from './dto/create-desligamento.dto';

@Injectable()
export class DesligamentoService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  findAll(query: any) {
    const where: any = {};
    if (query?.estado) where.estado = query.estado;
    return this.prisma.desligamento.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { funcionario: { select: { firstName: true, lastName: true, numeroFuncionario: true } } },
    });
  }

  async findOne(id: string) {
    const desligamento = await this.prisma.desligamento.findUnique({ where: { id }, include: { funcionario: true } });
    if (!desligamento) throw new NotFoundException('Processo de desligamento não encontrado');
    return desligamento;
  }

  async create(dto: CreateDesligamentoDto, actorUserId: string) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { id: dto.funcionarioId } });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado');
    if (funcionario.estado === 'DESLIGADO') throw new ConflictException('Funcionário já está desligado');

    const desligamento = await this.prisma.desligamento.create({
      data: {
        ...dto,
        dataSaida: dto.dataSaida ? new Date(dto.dataSaida) : undefined,
        iniciadoPorId: actorUserId,
        estado: 'AGUARDA_APROVACAO',
      },
    });
    await this.audit.log({ userId: actorUserId, action: 'DESLIGAMENTO_INICIADO', entity: 'Desligamento', entityId: desligamento.id });
    return desligamento;
  }

  async aprovar(id: string, actorUserId: string) {
    const desligamento = await this.findOne(id);
    if (desligamento.estado !== 'AGUARDA_APROVACAO') throw new ConflictException('Processo não está aguardando aprovação');

    const funcionario = await this.prisma.funcionario.findUnique({ where: { id: desligamento.funcionarioId } });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado');

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.desligamento.update({
        where: { id },
        data: {
          estado: 'CONCLUIDO',
          aprovadoPorId: actorUserId,
          aprovadoEm: now,
          acessosDesativadosEm: now,
          arquivadoEm: now,
        },
      });

      await tx.funcionario.update({ where: { id: funcionario.id }, data: { estado: 'DESLIGADO' } });

      await tx.user.update({
        where: { id: funcionario.userId },
        data: { isActive: false, refreshToken: null },
      });

      if (funcionario.instructorId) {
        await tx.instructor.update({ where: { id: funcionario.instructorId }, data: { isActive: false } });
      }

      await tx.escala.updateMany({
        where: { funcionarioId: funcionario.id, data: { gte: now }, estado: { not: 'CANCELADA' } },
        data: { estado: 'CANCELADA' },
      });
    });

    await this.audit.log({ userId: actorUserId, action: 'DESLIGAMENTO_APROVADO', entity: 'Desligamento', entityId: id, newValues: { funcionarioId: funcionario.id } });
    return this.findOne(id);
  }

  async rejeitar(id: string, actorUserId: string) {
    const desligamento = await this.findOne(id);
    if (desligamento.estado !== 'AGUARDA_APROVACAO') throw new ConflictException('Processo não está aguardando aprovação');
    const updated = await this.prisma.desligamento.update({ where: { id }, data: { estado: 'REJEITADO' } });
    await this.audit.log({ userId: actorUserId, action: 'DESLIGAMENTO_REJEITADO', entity: 'Desligamento', entityId: id });
    return updated;
  }
}
