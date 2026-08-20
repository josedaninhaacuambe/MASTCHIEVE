import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreateRotinaDto } from './dto/create-rotina.dto';
import { UpdateRotinaDto } from './dto/update-rotina.dto';

function inicioDoDia(data?: string) {
  const d = data ? new Date(data) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class RotinaDiariaService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

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
      include: { unidade: { select: { id: true, nome: true } }, concluidoPor: { select: { id: true, email: true } } },
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
}
