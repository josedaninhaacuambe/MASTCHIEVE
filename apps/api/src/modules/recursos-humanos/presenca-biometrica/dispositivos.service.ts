import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreateDispositivoDto } from './dto/create-dispositivo.dto';

@Injectable()
export class DispositivosService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  findAll(query: any) {
    const where: any = {};
    if (query?.unidadeId) where.unidadeId = query.unidadeId;
    if (query?.ativo !== undefined) where.ativo = query.ativo === 'true' || query.ativo === true;
    return this.prisma.dispositivoQuiosque.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { unidade: { select: { nome: true } } },
    });
  }

  async findOne(id: string) {
    const device = await this.prisma.dispositivoQuiosque.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Dispositivo não encontrado');
    return device;
  }

  async create(dto: CreateDispositivoDto, actorUserId: string) {
    const chave = crypto.randomBytes(24).toString('hex');
    const chaveHash = await bcrypt.hash(chave, 10);

    const device = await this.prisma.dispositivoQuiosque.create({
      data: { nome: dto.nome, unidadeId: dto.unidadeId, chaveHash, criadoPorId: actorUserId },
    });
    await this.audit.log({
      userId: actorUserId,
      action: 'DISPOSITIVO_QUIOSQUE_CRIADO',
      entity: 'DispositivoQuiosque',
      entityId: device.id,
    });

    return { ...device, chave };
  }

  async toggleAtivo(id: string, ativo: boolean, actorUserId: string) {
    await this.findOne(id);
    const device = await this.prisma.dispositivoQuiosque.update({ where: { id }, data: { ativo } });
    await this.audit.log({
      userId: actorUserId,
      action: ativo ? 'DISPOSITIVO_QUIOSQUE_ATIVADO' : 'DISPOSITIVO_QUIOSQUE_DESATIVADO',
      entity: 'DispositivoQuiosque',
      entityId: id,
    });
    return device;
  }

  async rotateKey(id: string, actorUserId: string) {
    await this.findOne(id);
    const chave = crypto.randomBytes(24).toString('hex');
    const chaveHash = await bcrypt.hash(chave, 10);
    const device = await this.prisma.dispositivoQuiosque.update({ where: { id }, data: { chaveHash } });
    await this.audit.log({
      userId: actorUserId,
      action: 'DISPOSITIVO_QUIOSQUE_CHAVE_ROTACIONADA',
      entity: 'DispositivoQuiosque',
      entityId: id,
    });
    return { ...device, chave };
  }
}
