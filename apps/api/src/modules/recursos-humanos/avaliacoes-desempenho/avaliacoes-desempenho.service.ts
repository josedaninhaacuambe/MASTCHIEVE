import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { RealizarAvaliacaoDto } from './dto/realizar-avaliacao.dto';

@Injectable()
export class AvaliacoesDesempenhoService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  findAll(query: any) {
    const where: any = {};
    if (query?.funcionarioId) where.funcionarioId = query.funcionarioId;
    if (query?.estado) where.estado = query.estado;
    return this.prisma.avaliacaoDesempenho.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { funcionario: { select: { firstName: true, lastName: true } } },
    });
  }

  async findOne(id: string) {
    const avaliacao = await this.prisma.avaliacaoDesempenho.findUnique({ where: { id } });
    if (!avaliacao) throw new NotFoundException('Avaliação não encontrada');
    return avaliacao;
  }

  async create(dto: CreateAvaliacaoDto, actorUserId: string) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { id: dto.funcionarioId } });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado');

    const avaliacao = await this.prisma.avaliacaoDesempenho.create({
      data: {
        funcionarioId: dto.funcionarioId,
        periodo: dto.periodo,
        dataLimite: dto.dataLimite ? new Date(dto.dataLimite) : undefined,
        avaliadorId: actorUserId,
      },
    });
    await this.audit.log({ userId: actorUserId, action: 'AVALIACAO_DESEMPENHO_AGENDADA', entity: 'AvaliacaoDesempenho', entityId: avaliacao.id });
    return avaliacao;
  }

  async realizar(id: string, dto: RealizarAvaliacaoDto, actorUserId: string) {
    await this.findOne(id);
    const notas = [dto.pontualidade, dto.competenciaTecnica, dto.trabalhoEquipa, dto.atendimento].filter(
      (n): n is number => typeof n === 'number',
    );
    const pontuacaoGeral = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : undefined;

    const updated = await this.prisma.avaliacaoDesempenho.update({
      where: { id },
      data: { ...dto, pontuacaoGeral, estado: 'REALIZADA', avaliadorId: actorUserId, dataAvaliacao: new Date() },
    });
    await this.audit.log({ userId: actorUserId, action: 'AVALIACAO_DESEMPENHO_REALIZADA', entity: 'AvaliacaoDesempenho', entityId: id });
    return updated;
  }
}
