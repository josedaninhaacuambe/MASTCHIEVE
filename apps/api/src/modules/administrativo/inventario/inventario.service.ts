import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CreateMovimentoDto } from './dto/create-movimento.dto';

@Injectable()
export class InventarioService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async findAllItens(query: any) {
    const where: any = {};
    if (query.unidadeId) where.unidadeId = query.unidadeId;
    if (query.categoria) where.categoria = query.categoria;
    if (query.ativo !== undefined) where.ativo = query.ativo === 'true' || query.ativo === true;
    return this.prisma.itemInventario.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: { unidade: { select: { id: true, nome: true } } },
    });
  }

  async findOneItem(id: string) {
    const item = await this.prisma.itemInventario.findUnique({
      where: { id },
      include: {
        unidade: { select: { id: true, nome: true } },
        movimentos: { orderBy: { createdAt: 'desc' }, take: 20, include: { responsavel: { select: { id: true, email: true } } } },
      },
    });
    if (!item) throw new NotFoundException('Item de inventário não encontrado');
    return item;
  }

  async createItem(dto: CreateItemDto, actorUserId: string) {
    const item = await this.prisma.itemInventario.create({
      data: {
        nome: dto.nome,
        categoria: dto.categoria || 'OUTRO',
        unidadeId: dto.unidadeId,
        quantidade: dto.quantidade ?? 0,
        quantidadeMin: dto.quantidadeMin ?? 0,
        unidadeMedida: dto.unidadeMedida || 'UN',
        localizacao: dto.localizacao,
      },
    });
    await this.audit.log({ userId: actorUserId, action: 'ITEM_INVENTARIO_CRIADO', entity: 'ItemInventario', entityId: item.id });
    return item;
  }

  async updateItem(id: string, dto: UpdateItemDto, actorUserId: string) {
    await this.findOneItem(id);
    const updated = await this.prisma.itemInventario.update({
      where: { id },
      data: { ...dto },
    });
    await this.audit.log({ userId: actorUserId, action: 'ITEM_INVENTARIO_ATUALIZADO', entity: 'ItemInventario', entityId: id });
    return updated;
  }

  async registarMovimento(itemId: string, dto: CreateMovimentoDto, actorUserId: string) {
    const item = await this.prisma.itemInventario.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item de inventário não encontrado');

    let delta = dto.quantidade;
    if (dto.tipo === 'ENTRADA') {
      if (dto.quantidade <= 0) throw new BadRequestException('Quantidade de entrada deve ser positiva');
      delta = dto.quantidade;
    } else if (dto.tipo === 'SAIDA') {
      if (dto.quantidade <= 0) throw new BadRequestException('Quantidade de saída deve ser positiva');
      delta = -dto.quantidade;
    }

    const novaQuantidade = item.quantidade + delta;
    if (novaQuantidade < 0) throw new BadRequestException('Stock insuficiente para esta saída');

    const [movimento] = await this.prisma.$transaction([
      this.prisma.movimentoInventario.create({
        data: { itemId, tipo: dto.tipo, quantidade: delta, motivo: dto.motivo, responsavelId: actorUserId },
      }),
      this.prisma.itemInventario.update({ where: { id: itemId }, data: { quantidade: novaQuantidade } }),
    ]);

    await this.audit.log({ userId: actorUserId, action: 'MOVIMENTO_INVENTARIO_REGISTADO', entity: 'ItemInventario', entityId: itemId, newValues: { tipo: dto.tipo, delta } });
    return movimento;
  }

  async findMovimentos(query: any) {
    const where: any = {};
    if (query.itemId) where.itemId = query.itemId;
    return this.prisma.movimentoInventario.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { item: { select: { id: true, nome: true } }, responsavel: { select: { id: true, email: true } } },
    });
  }

  async findAlertas() {
    const itens = await this.prisma.itemInventario.findMany({ where: { ativo: true } });
    return itens.filter((i) => i.quantidade <= i.quantidadeMin);
  }
}
