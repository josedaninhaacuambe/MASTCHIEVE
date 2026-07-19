import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreateOcorrenciaDto } from './dto/create-ocorrencia.dto';
import { DecidirOcorrenciaDto } from './dto/decidir-ocorrencia.dto';

@Injectable()
export class DisciplinaService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  findAll(query: any) {
    const where: any = {};
    if (query?.funcionarioId) where.funcionarioId = query.funcionarioId;
    if (query?.estado) where.estado = query.estado;
    if (query?.gravidade) where.gravidade = query.gravidade;
    return this.prisma.ocorrenciaDisciplinar.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { funcionario: { select: { firstName: true, lastName: true } } },
    });
  }

  async findOne(id: string) {
    const ocorrencia = await this.prisma.ocorrenciaDisciplinar.findUnique({ where: { id } });
    if (!ocorrencia) throw new NotFoundException('Ocorrência não encontrada');
    return ocorrencia;
  }

  async create(dto: CreateOcorrenciaDto, actorUserId: string) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { id: dto.funcionarioId } });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado');

    const gravidade = dto.gravidade || 'LEVE';
    const ocorrencia = await this.prisma.ocorrenciaDisciplinar.create({
      data: {
        ...dto,
        data: dto.data ? new Date(dto.data) : new Date(),
        gravidade,
        estado: gravidade === 'GRAVE' ? 'ESCALADA_SUPER_ADMIN' : 'REGISTADA',
        registadoPorId: actorUserId,
      },
    });
    await this.audit.log({ userId: actorUserId, action: 'OCORRENCIA_DISCIPLINAR_REGISTADA', entity: 'OcorrenciaDisciplinar', entityId: ocorrencia.id });
    return ocorrencia;
  }

  async decidir(id: string, dto: DecidirOcorrenciaDto, actorUserId: string, actorRole: string) {
    const ocorrencia = await this.findOne(id);
    if (ocorrencia.gravidade === 'GRAVE' && actorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Ocorrências graves só podem ser decididas pelo Super Admin');
    }
    if (ocorrencia.estado === 'RESOLVIDA_RH' || ocorrencia.estado === 'DECIDIDA_SUPER_ADMIN') {
      throw new ConflictException('Ocorrência já foi decidida');
    }

    const updated = await this.prisma.ocorrenciaDisciplinar.update({
      where: { id },
      data: {
        decisaoFinal: dto.decisaoFinal,
        medidaAplicada: dto.medidaAplicada,
        estado: ocorrencia.gravidade === 'GRAVE' ? 'DECIDIDA_SUPER_ADMIN' : 'RESOLVIDA_RH',
        decididoPorId: actorUserId,
        decididoEm: new Date(),
      },
    });
    await this.audit.log({ userId: actorUserId, action: 'OCORRENCIA_DISCIPLINAR_DECIDIDA', entity: 'OcorrenciaDisciplinar', entityId: id, newValues: { decisaoFinal: dto.decisaoFinal } });
    return updated;
  }
}
