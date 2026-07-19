import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreateContratoDto } from './dto/create-contrato.dto';

@Injectable()
export class ContratosService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  findAll(query: any) {
    const where: any = {};
    if (query?.funcionarioId) where.funcionarioId = query.funcionarioId;
    if (query?.estado) where.estado = query.estado;
    return this.prisma.contrato.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { funcionario: { select: { firstName: true, lastName: true, numeroFuncionario: true } } },
    });
  }

  async findOne(id: string) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id },
      include: { funcionario: true },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado');
    return contrato;
  }

  async create(dto: CreateContratoDto, actorUserId: string) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { id: dto.funcionarioId } });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado');

    const contrato = await this.prisma.contrato.create({
      data: {
        ...dto,
        dataInicio: new Date(dto.dataInicio),
        dataFim: dto.dataFim ? new Date(dto.dataFim) : undefined,
        elaboradoPorId: actorUserId,
        estado: 'AGUARDA_ASSINATURA',
      },
    });
    await this.audit.log({ userId: actorUserId, action: 'CONTRATO_CRIADO', entity: 'Contrato', entityId: contrato.id });
    return contrato;
  }

  async assinar(id: string, actorUserId: string) {
    const contrato = await this.findOne(id);
    if (contrato.estado !== 'RASCUNHO' && contrato.estado !== 'AGUARDA_ASSINATURA') {
      throw new ConflictException('Contrato não está pronto para assinatura');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.contrato.update({
        where: { id },
        data: { estado: 'ATIVO', assinadoPorId: actorUserId, assinadoEm: new Date() },
      }),
      this.prisma.funcionario.update({
        where: { id: contrato.funcionarioId },
        data: { estado: 'ATIVO' },
      }),
    ]);

    await this.audit.log({ userId: actorUserId, action: 'CONTRATO_ASSINADO', entity: 'Contrato', entityId: id });
    return updated;
  }

  async rescindir(id: string, actorUserId: string) {
    await this.findOne(id);
    const updated = await this.prisma.contrato.update({ where: { id }, data: { estado: 'RESCINDIDO' } });
    await this.audit.log({ userId: actorUserId, action: 'CONTRATO_RESCINDIDO', entity: 'Contrato', entityId: id });
    return updated;
  }
}
