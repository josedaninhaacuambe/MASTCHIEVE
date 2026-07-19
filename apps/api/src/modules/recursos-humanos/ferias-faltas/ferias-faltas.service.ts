import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreateFeriasFaltaDto } from './dto/create-ferias-falta.dto';

@Injectable()
export class FeriasFaltasService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  findAll(query: any) {
    const where: any = {};
    if (query?.funcionarioId) where.funcionarioId = query.funcionarioId;
    if (query?.estado) where.estado = query.estado;
    return this.prisma.feriasFalta.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { funcionario: { select: { firstName: true, lastName: true } } },
    });
  }

  async findOne(id: string) {
    const registo = await this.prisma.feriasFalta.findUnique({ where: { id } });
    if (!registo) throw new NotFoundException('Pedido de férias/falta não encontrado');
    return registo;
  }

  async create(dto: CreateFeriasFaltaDto, actorUserId: string) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { id: dto.funcionarioId } });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado');

    const registo = await this.prisma.feriasFalta.create({
      data: {
        ...dto,
        dataInicio: new Date(dto.dataInicio),
        dataFim: new Date(dto.dataFim),
        solicitanteId: actorUserId,
        estado: dto.excepcional ? 'ENCAMINHADA_SUPER_ADMIN' : 'PENDENTE',
      },
    });
    await this.audit.log({ userId: actorUserId, action: 'FERIAS_FALTA_SOLICITADA', entity: 'FeriasFalta', entityId: registo.id });
    return registo;
  }

  async aprovar(id: string, actorUserId: string, actorRole: string) {
    const registo = await this.findOne(id);
    if (registo.excepcional && actorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Pedidos excecionais só podem ser aprovados pelo Super Admin');
    }
    if (registo.estado !== 'PENDENTE' && registo.estado !== 'ENCAMINHADA_SUPER_ADMIN') {
      throw new ConflictException('Pedido não está pendente de aprovação');
    }

    const updated = await this.prisma.feriasFalta.update({
      where: { id },
      data: {
        estado: registo.excepcional ? 'APROVADA_SUPER_ADMIN' : 'APROVADA_RH',
        aprovadoPorId: actorUserId,
        aprovadoEm: new Date(),
      },
    });
    await this.audit.log({ userId: actorUserId, action: 'FERIAS_FALTA_APROVADA', entity: 'FeriasFalta', entityId: id });
    return updated;
  }

  async rejeitar(id: string, motivoRejeicao: string | undefined, actorUserId: string, actorRole: string) {
    const registo = await this.findOne(id);
    if (registo.excepcional && actorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Pedidos excecionais só podem ser rejeitados pelo Super Admin');
    }
    const updated = await this.prisma.feriasFalta.update({
      where: { id },
      data: { estado: 'REJEITADA', motivoRejeicao },
    });
    await this.audit.log({ userId: actorUserId, action: 'FERIAS_FALTA_REJEITADA', entity: 'FeriasFalta', entityId: id });
    return updated;
  }
}
