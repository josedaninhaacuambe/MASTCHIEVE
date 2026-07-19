import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CertificacoesService } from '../certificacoes/certificacoes.service';
import { CreateEscalaDto } from './dto/create-escala.dto';

@Injectable()
export class EscalasService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private certificacoesService: CertificacoesService,
  ) {}

  findAll(query: any) {
    const where: any = {};
    if (query?.funcionarioId) where.funcionarioId = query.funcionarioId;
    if (query?.unidadeId) where.unidadeId = query.unidadeId;
    if (query?.dataInicio || query?.dataFim) {
      where.data = {};
      if (query.dataInicio) where.data.gte = new Date(query.dataInicio);
      if (query.dataFim) where.data.lte = new Date(query.dataFim);
    }
    return this.prisma.escala.findMany({
      where,
      orderBy: { data: 'asc' },
      include: { funcionario: { select: { firstName: true, lastName: true, cargo: true } } },
    });
  }

  async findOne(id: string) {
    const escala = await this.prisma.escala.findUnique({ where: { id } });
    if (!escala) throw new NotFoundException('Escala não encontrada');
    return escala;
  }

  async create(dto: CreateEscalaDto, actorUserId: string) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { id: dto.funcionarioId } });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado');

    if (dto.tipo === 'AULA' || dto.tipo === 'SALVAMENTO' || !dto.tipo) {
      await this.certificacoesService.assertCertificacoesValidas(dto.funcionarioId);
    }

    const escala = await this.prisma.escala.create({
      data: { ...dto, data: new Date(dto.data) },
    });
    await this.audit.log({ userId: actorUserId, action: 'ESCALA_CRIADA', entity: 'Escala', entityId: escala.id });
    return escala;
  }

  async cancelar(id: string, actorUserId: string) {
    await this.findOne(id);
    const updated = await this.prisma.escala.update({ where: { id }, data: { estado: 'CANCELADA' } });
    await this.audit.log({ userId: actorUserId, action: 'ESCALA_CANCELADA', entity: 'Escala', entityId: id });
    return updated;
  }

  async confirmar(id: string, actorUserId: string) {
    await this.findOne(id);
    const updated = await this.prisma.escala.update({ where: { id }, data: { estado: 'CONFIRMADA' } });
    await this.audit.log({ userId: actorUserId, action: 'ESCALA_CONFIRMADA', entity: 'Escala', entityId: id });
    return updated;
  }
}
