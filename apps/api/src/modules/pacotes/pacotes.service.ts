import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { CreatePacoteDto, UpdatePacoteDto } from './dto/pacote.dto';

const arredondar = (v: number) => Math.round(v * 100) / 100;

@Injectable()
export class PacotesService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  listar(incluirInactivos = false) {
    return this.prisma.pacote.findMany({
      where: incluirInactivos ? undefined : { ativo: true },
      orderBy: [{ ativo: 'desc' }, { preco: 'asc' }, { nome: 'asc' }],
      include: { _count: { select: { students: { where: { isActive: true } } } } },
    });
  }

  async obter(id: string) {
    const p = await this.prisma.pacote.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Pacote não encontrado');
    return p;
  }

  async criar(dto: CreatePacoteDto, userId: string) {
    const p = await this.prisma.pacote.create({
      data: {
        nome: dto.nome.trim(),
        descricao: dto.descricao?.trim() || null,
        preco: arredondar(dto.preco),
        aulasPorSemana: dto.aulasPorSemana ?? null,
        ativo: dto.ativo ?? true,
        criadoPorId: userId,
      },
    });
    await this.audit.log({ userId, action: 'PACOTE_CRIADO', entity: 'Pacote', entityId: p.id, newValues: { nome: p.nome, preco: p.preco } });
    return p;
  }

  /**
   * Alterar o preço só afecta as cobranças geradas a partir de agora;
   * mensalidades e pagamentos já criados mantêm o valor original.
   */
  async actualizar(id: string, dto: UpdatePacoteDto, userId: string) {
    const antes = await this.obter(id);
    const p = await this.prisma.pacote.update({
      where: { id },
      data: {
        ...(dto.nome !== undefined && { nome: dto.nome.trim() }),
        ...(dto.descricao !== undefined && { descricao: dto.descricao?.trim() || null }),
        ...(dto.preco !== undefined && { preco: arredondar(dto.preco) }),
        ...(dto.aulasPorSemana !== undefined && { aulasPorSemana: dto.aulasPorSemana }),
        ...(dto.ativo !== undefined && { ativo: dto.ativo }),
      },
    });
    await this.audit.log({
      userId,
      action: 'PACOTE_ACTUALIZADO',
      entity: 'Pacote',
      entityId: id,
      oldValues: { nome: antes.nome, preco: antes.preco, ativo: antes.ativo },
      newValues: { nome: p.nome, preco: p.preco, ativo: p.ativo },
    });
    return p;
  }

  /** Não se apaga, para preservar o histórico: o pacote passa a inactivo. */
  desactivar(id: string, userId: string) {
    return this.actualizar(id, { ativo: false }, userId);
  }
}
