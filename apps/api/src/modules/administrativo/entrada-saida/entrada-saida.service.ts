import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreatePessoaAutorizadaDto } from './dto/create-pessoa-autorizada.dto';
import { CreateRegistoDto } from './dto/create-registo.dto';
import { BulkRegistoDto } from './dto/create-registo-bulk.dto';
import { validarHoraManual } from './hora-manual.util';
import {
  JANELA_SAIDA_MAX_H, RegistoSessao, decidirSaidaManual, saidaAutomaticaPara, validarNovaEntrada,
} from './sessao-aula.util';

@Injectable()
export class EntradaSaidaService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private lerHoraManual(valor?: string): Date | undefined {
    if (!valor) return undefined;
    const hora = new Date(valor);
    const erro = validarHoraManual(hora);
    if (erro) throw new BadRequestException(erro);
    return hora;
  }

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

  /** Registos de cada atleta perto da hora indicada (para validar a sessão de aula). */
  private async registosPerto(tx: Prisma.TransactionClient, studentIds: string[], hora: Date) {
    const margem = JANELA_SAIDA_MAX_H * 60 * 60_000;
    const regs = await tx.registoEntradaSaidaAluno.findMany({
      where: {
        studentId: { in: studentIds },
        dataHora: { gte: new Date(hora.getTime() - margem), lte: new Date(hora.getTime() + margem) },
      },
      select: { id: true, studentId: true, tipo: true, dataHora: true, automatica: true },
    });
    const porAtleta = new Map<string, RegistoSessao[]>(studentIds.map((id) => [id, []]));
    for (const r of regs) porAtleta.get(r.studentId)?.push(r);
    return porAtleta;
  }

  /** Bloqueia as linhas dos atletas até ao fim da transacção, para evitar registos em duplicado. */
  private async bloquearAtletas(tx: Prisma.TransactionClient, studentIds: string[]) {
    await tx.$queryRaw`SELECT id FROM students WHERE id IN (${Prisma.join(studentIds)}) FOR UPDATE`;
  }

  /** Cria a entrada e a respectiva saída automática ao fim da aula. */
  private async criarEntrada(tx: Prisma.TransactionClient, studentId: string, hora: Date, actorUserId: string) {
    const entrada = await tx.registoEntradaSaidaAluno.create({
      data: { studentId, tipo: 'ENTRADA', dataHora: hora, registadoPorId: actorUserId },
    });
    const saida = await tx.registoEntradaSaidaAluno.create({
      data: { studentId, tipo: 'SAIDA', dataHora: saidaAutomaticaPara(hora), automatica: true, registadoPorId: actorUserId },
    });
    return { entrada, saida };
  }

  /** Regista a saída manual: substitui a saída automática da aula, se existir. */
  private async gravarSaidaManual(
    tx: Prisma.TransactionClient,
    dados: { studentId: string; tipo: string; hora: Date; pessoaAutorizadaId?: string; justificativa?: string },
    substituir: RegistoSessao | undefined,
    actorUserId: string,
  ) {
    const data = {
      tipo: dados.tipo,
      dataHora: dados.hora,
      automatica: false,
      pessoaAutorizadaId: dados.pessoaAutorizadaId ?? null,
      justificativa: dados.justificativa?.trim() || null,
      registadoPorId: actorUserId,
    };
    // createdAt passa a ser o momento em que a saída manual foi lançada.
    if (substituir) return tx.registoEntradaSaidaAluno.update({ where: { id: substituir.id }, data: { ...data, createdAt: new Date() } });
    return tx.registoEntradaSaidaAluno.create({ data: { ...data, studentId: dados.studentId } });
  }

  async createRegisto(dto: CreateRegistoDto, actorUserId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Atleta não encontrado');
    const horaManual = this.lerHoraManual(dto.dataHora);
    const hora = horaManual ?? new Date();

    if (dto.tipo === 'SAIDA' || dto.tipo === 'CANCELAMENTO') {
      if (dto.tipo === 'CANCELAMENTO' && !dto.justificativa?.trim()) {
        throw new BadRequestException('Cancelamento de entrada exige uma justificação');
      }
      if (dto.pessoaAutorizadaId) {
        const pessoa = await this.prisma.pessoaAutorizada.findUnique({ where: { id: dto.pessoaAutorizadaId } });
        if (!pessoa || !pessoa.ativo || pessoa.studentId !== dto.studentId) {
          throw new BadRequestException('Pessoa autorizada inválida para este atleta');
        }
      }
    }

    const { registo, saidaAutomatica, substituiuAutomatica } = await this.prisma.$transaction(async (tx) => {
      await this.bloquearAtletas(tx, [dto.studentId]);
      const regs = (await this.registosPerto(tx, [dto.studentId], hora)).get(dto.studentId) ?? [];

      if (dto.tipo === 'ENTRADA') {
        const erro = validarNovaEntrada(regs, hora);
        if (erro) throw new BadRequestException(erro);
        const { entrada, saida } = await this.criarEntrada(tx, dto.studentId, hora, actorUserId);
        return { registo: entrada, saidaAutomatica: saida, substituiuAutomatica: false };
      }

      const decisao = decidirSaidaManual(regs, hora);
      if ('erro' in decisao) throw new BadRequestException(decisao.erro);
      const saida = await this.gravarSaidaManual(
        tx,
        { studentId: dto.studentId, tipo: dto.tipo, hora, pessoaAutorizadaId: dto.pessoaAutorizadaId, justificativa: dto.justificativa },
        decisao.substituir,
        actorUserId,
      );
      return { registo: saida, saidaAutomatica: undefined, substituiuAutomatica: !!decisao.substituir };
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'REGISTO_ENTRADA_SAIDA_CRIADO',
      entity: 'RegistoEntradaSaidaAluno',
      entityId: registo.id,
      newValues: {
        tipo: dto.tipo,
        studentId: dto.studentId,
        ...(horaManual && { horaManual: true, dataHora: horaManual }),
        ...(saidaAutomatica && { saidaAutomatica: saidaAutomatica.dataHora }),
        ...(substituiuAutomatica && { substituiuSaidaAutomatica: true }),
      },
    });
    return { ...registo, ...(saidaAutomatica && { saidaPrevista: saidaAutomatica.dataHora }) };
  }

  async createRegistoBulk(dto: BulkRegistoDto, actorUserId: string) {
    const horaManual = this.lerHoraManual(dto.dataHora);
    const hora = horaManual ?? new Date();

    const studentIds = [...new Set(dto.studentIds)];
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    if (students.length !== studentIds.length) {
      const found = new Set(students.map((s) => s.id));
      const missing = studentIds.filter((id) => !found.has(id));
      throw new NotFoundException(`Atleta(s) não encontrado(s): ${missing.join(', ')}`);
    }
    const nomes = new Map(students.map((s) => [s.id, `${s.firstName} ${s.lastName}`.trim()]));

    // Atletas que não cumprem a regra (já em aula / sem entrada) são ignorados e indicados na resposta.
    const { registados, ignorados } = await this.prisma.$transaction(async (tx) => {
      await this.bloquearAtletas(tx, studentIds);
      const porAtleta = await this.registosPerto(tx, studentIds, hora);
      const registados: string[] = [];
      const ignorados: { studentId: string; nome: string; motivo: string }[] = [];

      for (const studentId of studentIds) {
        const regs = porAtleta.get(studentId) ?? [];
        if (dto.tipo === 'ENTRADA') {
          const erro = validarNovaEntrada(regs, hora);
          if (erro) { ignorados.push({ studentId, nome: nomes.get(studentId) ?? '', motivo: erro }); continue; }
          await this.criarEntrada(tx, studentId, hora, actorUserId);
        } else {
          const decisao = decidirSaidaManual(regs, hora);
          if ('erro' in decisao) { ignorados.push({ studentId, nome: nomes.get(studentId) ?? '', motivo: decisao.erro }); continue; }
          await this.gravarSaidaManual(tx, { studentId, tipo: 'SAIDA', hora, justificativa: dto.justificativa }, decisao.substituir, actorUserId);
        }
        registados.push(studentId);
      }
      return { registados, ignorados };
    }, { timeout: 20_000 });

    await this.audit.log({
      userId: actorUserId,
      action: 'REGISTO_ENTRADA_SAIDA_BULK_CRIADO',
      entity: 'RegistoEntradaSaidaAluno',
      newValues: {
        tipo: dto.tipo,
        count: registados.length,
        studentIds: registados,
        ...(ignorados.length > 0 && { ignorados: ignorados.map((i) => i.studentId) }),
        ...(horaManual && { horaManual: true, dataHora: horaManual }),
      },
    });

    return { count: registados.length, tipo: dto.tipo, ignorados };
  }
}
