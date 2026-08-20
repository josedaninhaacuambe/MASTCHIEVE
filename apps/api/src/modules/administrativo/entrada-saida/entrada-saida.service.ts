import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreatePessoaAutorizadaDto } from './dto/create-pessoa-autorizada.dto';
import { CreateRegistoDto } from './dto/create-registo.dto';

@Injectable()
export class EntradaSaidaService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async findPessoasAutorizadas(studentId: string) {
    return this.prisma.pessoaAutorizada.findMany({
      where: { studentId, ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async createPessoaAutorizada(dto: CreatePessoaAutorizadaDto, actorUserId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Atleta não encontrado');

    const pessoa = await this.prisma.pessoaAutorizada.create({ data: { ...dto } });
    await this.audit.log({ userId: actorUserId, action: 'PESSOA_AUTORIZADA_CRIADA', entity: 'PessoaAutorizada', entityId: pessoa.id });
    return pessoa;
  }

  async removePessoaAutorizada(id: string, actorUserId: string) {
    const pessoa = await this.prisma.pessoaAutorizada.findUnique({ where: { id } });
    if (!pessoa) throw new NotFoundException('Pessoa autorizada não encontrada');
    const updated = await this.prisma.pessoaAutorizada.update({ where: { id }, data: { ativo: false } });
    await this.audit.log({ userId: actorUserId, action: 'PESSOA_AUTORIZADA_DESATIVADA', entity: 'PessoaAutorizada', entityId: id });
    return updated;
  }

  async findRegistos(query: any) {
    const where: any = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.tipo) where.tipo = query.tipo;
    if (query.data) {
      const start = new Date(query.data);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.dataHora = { gte: start, lt: end };
    }
    return this.prisma.registoEntradaSaidaAluno.findMany({
      where,
      orderBy: { dataHora: 'desc' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        pessoaAutorizada: { select: { id: true, nome: true, parentesco: true } },
        registadoPor: { select: { id: true, email: true } },
      },
    });
  }

  async createRegisto(dto: CreateRegistoDto, actorUserId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Atleta não encontrado');

    if (dto.tipo === 'SAIDA') {
      if (!dto.pessoaAutorizadaId && !dto.justificativa?.trim()) {
        throw new BadRequestException('Saída exige uma pessoa autorizada válida ou uma justificação');
      }
      if (dto.pessoaAutorizadaId) {
        const pessoa = await this.prisma.pessoaAutorizada.findUnique({ where: { id: dto.pessoaAutorizadaId } });
        if (!pessoa || !pessoa.ativo || pessoa.studentId !== dto.studentId) {
          throw new BadRequestException('Pessoa autorizada inválida para este atleta');
        }
      }
    }

    const registo = await this.prisma.registoEntradaSaidaAluno.create({
      data: {
        studentId: dto.studentId,
        tipo: dto.tipo,
        pessoaAutorizadaId: dto.pessoaAutorizadaId,
        justificativa: dto.justificativa,
        registadoPorId: actorUserId,
      },
    });
    await this.audit.log({ userId: actorUserId, action: 'REGISTO_ENTRADA_SAIDA_CRIADO', entity: 'RegistoEntradaSaidaAluno', entityId: registo.id, newValues: { tipo: dto.tipo, studentId: dto.studentId } });
    return registo;
  }
}
