import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreateVagaDto } from './dto/create-vaga.dto';
import { RejeitarDto } from './dto/rejeitar.dto';

@Injectable()
export class VagasService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  findAll(query: any) {
    const where: any = {};
    if (query?.estado) where.estado = query.estado;
    if (query?.unidadeId) where.unidadeId = query.unidadeId;
    return this.prisma.vaga.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { solicitante: { select: { email: true } }, _count: { select: { candidaturas: true } } },
    });
  }

  async findOne(id: string) {
    const vaga = await this.prisma.vaga.findUnique({
      where: { id },
      include: { solicitante: { select: { email: true } }, candidaturas: { orderBy: { createdAt: 'desc' } } },
    });
    if (!vaga) throw new NotFoundException('Vaga não encontrada');
    return vaga;
  }

  async create(dto: CreateVagaDto, actorUserId: string) {
    const vaga = await this.prisma.vaga.create({
      data: { ...dto, solicitanteId: actorUserId, estado: 'EM_APROVACAO' },
    });
    await this.audit.log({ userId: actorUserId, action: 'VAGA_CRIADA', entity: 'Vaga', entityId: vaga.id });
    return vaga;
  }

  async aprovar(id: string, actorUserId: string) {
    const vaga = await this.findOne(id);
    if (vaga.estado !== 'EM_APROVACAO') throw new ConflictException('Vaga não está em aprovação');
    const updated = await this.prisma.vaga.update({
      where: { id },
      data: { estado: 'APROVADA', aprovadoPorId: actorUserId, aprovadoEm: new Date() },
    });
    await this.audit.log({ userId: actorUserId, action: 'VAGA_APROVADA', entity: 'Vaga', entityId: id });
    return updated;
  }

  async rejeitar(id: string, dto: RejeitarDto, actorUserId: string) {
    const vaga = await this.findOne(id);
    if (vaga.estado !== 'EM_APROVACAO') throw new ConflictException('Vaga não está em aprovação');
    const updated = await this.prisma.vaga.update({
      where: { id },
      data: { estado: 'REJEITADA', aprovadoPorId: actorUserId, aprovadoEm: new Date(), motivoRejeicao: dto.motivoRejeicao },
    });
    await this.audit.log({ userId: actorUserId, action: 'VAGA_REJEITADA', entity: 'Vaga', entityId: id });
    return updated;
  }

  async publicar(id: string, actorUserId: string) {
    const vaga = await this.findOne(id);
    if (vaga.estado !== 'APROVADA') throw new ConflictException('Vaga precisa estar aprovada para ser publicada');
    const updated = await this.prisma.vaga.update({
      where: { id },
      data: { estado: 'PUBLICADA', publicadaEm: new Date() },
    });
    await this.audit.log({ userId: actorUserId, action: 'VAGA_PUBLICADA', entity: 'Vaga', entityId: id });
    return updated;
  }

  async encerrar(id: string, actorUserId: string) {
    await this.findOne(id);
    const updated = await this.prisma.vaga.update({
      where: { id },
      data: { estado: 'ENCERRADA', encerradaEm: new Date() },
    });
    await this.audit.log({ userId: actorUserId, action: 'VAGA_ENCERRADA', entity: 'Vaga', entityId: id });
    return updated;
  }
}
