import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreateRotinaDto } from './dto/create-rotina.dto';
import { UpdateRotinaDto } from './dto/update-rotina.dto';
import { RegistarAguaDto } from './dto/registar-agua.dto';
import { RegistarEquipamentosDto } from './dto/registar-equipamentos.dto';
import { RegistarMaterialDto } from './dto/registar-material.dto';
import { calcularStatusInstrutor } from './rotina-diaria-status.util';
import { NotificationsGateway } from '../../notifications/notifications.gateway';

function inicioDoDia(data?: string) {
  const d = data ? new Date(data) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function fimDoDia(data?: string) {
  const d = inicioDoDia(data);
  d.setDate(d.getDate() + 1);
  return d;
}

@Injectable()
export class RotinaDiariaService {
  constructor(private prisma: PrismaService, private audit: AuditService, private gateway: NotificationsGateway) {}

  async findAll(query: any) {
    const where: any = {};
    if (query.unidadeId) where.unidadeId = query.unidadeId;
    if (query.data) {
      const start = inicioDoDia(query.data);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.data = { gte: start, lt: end };
    }
    return this.prisma.rotinaDiaria.findMany({
      where,
      orderBy: { data: 'desc' },
      include: { unidade: { select: { id: true, nome: true } }, concluidoPor: { select: { id: true, email: true } } },
    });
  }

  async findOne(id: string) {
    const rotina = await this.prisma.rotinaDiaria.findUnique({
      where: { id },
      include: {
        unidade: { select: { id: true, nome: true } },
        concluidoPor: { select: { id: true, email: true } },
        aguaRegistadoPor: { select: { id: true, email: true } },
        equipamentosRegistadoPor: { select: { id: true, email: true } },
        materiais: { orderBy: { registadoEm: 'desc' } },
      },
    });
    if (!rotina) throw new NotFoundException('Rotina diária não encontrada');
    return rotina;
  }

  async create(dto: CreateRotinaDto, actorUserId: string) {
    const data = inicioDoDia(dto.data);
    const existente = await this.prisma.rotinaDiaria.findUnique({
      where: { unidadeId_data_tipo: { unidadeId: dto.unidadeId, data, tipo: dto.tipo } },
    });
    if (existente) throw new ConflictException(`Rotina de ${dto.tipo} já existe para esta unidade e data`);

    const rotina = await this.prisma.rotinaDiaria.create({
      data: {
        unidadeId: dto.unidadeId,
        data,
        tipo: dto.tipo,
        checklist: JSON.stringify(dto.checklist),
      },
    });
    await this.audit.log({ userId: actorUserId, action: 'ROTINA_DIARIA_CRIADA', entity: 'RotinaDiaria', entityId: rotina.id });
    return rotina;
  }

  async update(id: string, dto: UpdateRotinaDto, actorUserId: string) {
    const rotina = await this.findOne(id);
    const concluido = dto.checklist.length > 0 && dto.checklist.every((i) => i.concluido);

    const updated = await this.prisma.rotinaDiaria.update({
      where: { id },
      data: {
        checklist: JSON.stringify(dto.checklist),
        observacoes: dto.observacoes,
        concluido,
        concluidoPorId: concluido ? actorUserId : null,
        concluidoEm: concluido ? new Date() : null,
      },
    });
    await this.audit.log({ userId: actorUserId, action: 'ROTINA_DIARIA_ATUALIZADA', entity: 'RotinaDiaria', entityId: id, newValues: { concluido } });
    return updated;
  }

  private async resolveInstrutorUnidade(userId: string) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { userId },
      include: { unidades: true },
    });
    if (!instructor) throw new NotFoundException('Instrutor não encontrado');
    const unidade = instructor.unidades.find((u) => u.isPrimary) ?? instructor.unidades[0];
    if (!unidade) throw new NotFoundException('Instrutor sem unidade atribuída');
    return { instructor, unidadeId: unidade.unidadeId };
  }

  private async assertRotinaDaUnidade(rotinaId: string, unidadeId: string) {
    const rotina = await this.prisma.rotinaDiaria.findUnique({
      where: { id: rotinaId },
      include: { materiais: true },
    });
    if (!rotina) throw new NotFoundException('Rotina diária não encontrada');
    if (rotina.unidadeId !== unidadeId) throw new ForbiddenException('Rotina não pertence à tua unidade');
    return rotina;
  }

  async getStatusInstrutor(userId: string) {
    const { instructor, unidadeId } = await this.resolveInstrutorUnidade(userId);
    const rotina = await this.prisma.rotinaDiaria.findFirst({
      where: { unidadeId, tipo: 'ABERTURA', data: { gte: inicioDoDia(), lt: fimDoDia() } },
      include: {
        materiais: { where: { instrutorId: instructor.id }, orderBy: { registadoEm: 'desc' } },
        aguaRegistadoPor: { select: { id: true, email: true } },
        equipamentosRegistadoPor: { select: { id: true, email: true } },
        unidade: { select: { id: true, nome: true } },
      },
    });
    const { status, pendentes } = calcularStatusInstrutor(rotina, instructor.id);
    return { status, pendentes, rotina };
  }

  async registarAgua(rotinaId: string, userId: string, dto: RegistarAguaDto, fotoUrl: string) {
    const { unidadeId } = await this.resolveInstrutorUnidade(userId);
    await this.assertRotinaDaUnidade(rotinaId, unidadeId);

    const result = await this.prisma.rotinaDiaria.updateMany({
      where: { id: rotinaId, aguaRegistadoPorId: null },
      data: {
        aguaTemperatura: dto.temperatura,
        aguaPh: dto.ph,
        aguaCloro: dto.cloro,
        aguaFotoUrl: fotoUrl,
        aguaRegistadoPorId: userId,
        aguaRegistadoEm: new Date(),
      },
    });
    if (result.count === 0) {
      return { ...(await this.findOne(rotinaId)), jaRegistadoPorOutro: true };
    }
    await this.audit.log({ userId, action: 'ROTINA_PARAMETROS_AGUA_REGISTADOS', entity: 'RotinaDiaria', entityId: rotinaId, newValues: dto });
    this.gateway.broadcastToRole('INSTRUCTOR', 'rotina-diaria:atualizada', { unidadeId });
    return this.findOne(rotinaId);
  }

  async registarEquipamentos(rotinaId: string, userId: string, dto: RegistarEquipamentosDto, fotoUrl: string) {
    const { unidadeId } = await this.resolveInstrutorUnidade(userId);
    await this.assertRotinaDaUnidade(rotinaId, unidadeId);

    const result = await this.prisma.rotinaDiaria.updateMany({
      where: { id: rotinaId, equipamentosRegistadoPorId: null },
      data: {
        equipamentosSeguranca: JSON.stringify(dto.itens),
        equipamentosFotoUrl: fotoUrl,
        equipamentosRegistadoPorId: userId,
        equipamentosRegistadoEm: new Date(),
      },
    });
    if (result.count === 0) {
      return { ...(await this.findOne(rotinaId)), jaRegistadoPorOutro: true };
    }
    await this.audit.log({ userId, action: 'ROTINA_EQUIPAMENTOS_REGISTADOS', entity: 'RotinaDiaria', entityId: rotinaId, newValues: dto });
    this.gateway.broadcastToRole('INSTRUCTOR', 'rotina-diaria:atualizada', { unidadeId });
    return this.findOne(rotinaId);
  }

  async registarMaterial(rotinaId: string, userId: string, dto: RegistarMaterialDto, fotoUrl: string | null) {
    const { instructor, unidadeId } = await this.resolveInstrutorUnidade(userId);
    await this.assertRotinaDaUnidade(rotinaId, unidadeId);

    const material = await this.prisma.rotinaDiariaMaterial.create({
      data: {
        rotinaDiariaId: rotinaId,
        instrutorId: instructor.id,
        item: dto.item,
        quantidade: dto.quantidade,
        fotoUrl,
      },
    });
    await this.audit.log({ userId, action: 'ROTINA_MATERIAL_REGISTADO', entity: 'RotinaDiariaMaterial', entityId: material.id, newValues: dto });
    return material;
  }
}
