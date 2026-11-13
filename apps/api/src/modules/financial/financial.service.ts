import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateCobrancaDto } from './dto/create-cobranca.dto';
import { PrismaService } from '../../config/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { destinatariosDoAtleta } from '../../common/utils/destinatarios-atleta.util';

const CASH_DISCREPANCY_THRESHOLD = 50;

const METODO_LABEL: Record<string, string> = {
  CASH: 'Numerário', TRANSFER: 'Transferência', VISA_CARD: 'Cartão Visa', EMOLA: 'e-Mola', MPESA: 'M-Pesa',
};
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const userLite = { select: { id: true, email: true, isActive: true } } as const;

@Injectable()
export class FinancialService {
  private readonly logger = new Logger(FinancialService.name);

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private audit: AuditService,
    private notifService: NotificationsService,
    private gateway: NotificationsGateway,
  ) {}

  async getPayments(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'desc' },
        include: {
          student: { select: { firstName: true, lastName: true } },
          monthlyFee: { select: { month: true, year: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getMyPayments(userId: string, query: any = {}) {
    const student = await this.prisma.student.findFirst({
      where: { userId },
      select: { id: true, enrollmentDate: true },
    });
    if (!student) return { data: [], meta: { total: 0, page: 1, limit: 200, totalPages: 0, years: [] } };

    const where: any = { studentId: student.id };
    if (query.year) {
      const y = Number(query.year);
      where.dueDate = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) };
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        take: 200,
        orderBy: { dueDate: 'desc' },
        include: {
          monthlyFee: { select: { month: true, year: true } },
        },
      }),
      this.prisma.payment.count({ where: { studentId: student.id } }),
    ]);

    // Build list of distinct years from ALL student payments
    const allYearRows = await this.prisma.payment.findMany({
      where: { studentId: student.id },
      select: { dueDate: true, monthlyFee: { select: { year: true } } },
      orderBy: { dueDate: 'asc' },
    });
    const yearSet = new Set<number>();
    allYearRows.forEach((p) => yearSet.add(p.monthlyFee?.year ?? new Date(p.dueDate).getFullYear()));
    const years = Array.from(yearSet).sort((a, b) => b - a);

    return {
      data,
      meta: { total, page: 1, limit: 200, totalPages: Math.ceil(total / 200), years },
    };
  }

  /**
   * Cobrança individual: um atleta, com valor e vencimento próprios.
   * MENSALIDADE cria também o registo do mês (um por atleta/mês); OUTRA é uma cobrança avulsa.
   */
  async createCobranca(dto: CreateCobrancaDto, actorUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!student) throw new NotFoundException('Atleta não encontrado');

    const dueDate = new Date(dto.dueDate);
    if (isNaN(dueDate.getTime())) throw new BadRequestException('Data de vencimento inválida');
    const tipo = dto.tipo ?? 'MENSALIDADE';
    const descricao = dto.descricao?.trim() || null;
    // O número de recibo só é atribuído quando o pagamento é registado (markAsPaid).
    let payment;
    if (tipo === 'MENSALIDADE') {
      if (!dto.month || !dto.year) throw new BadRequestException('Indique o mês e o ano da mensalidade');
      const { month, year } = dto;
      const existing = await this.prisma.monthlyFee.findUnique({
        where: { studentId_month_year: { studentId: student.id, month, year } },
      });
      if (existing) {
        throw new ConflictException(`${student.firstName} já tem a mensalidade de ${month}/${year}. Use "Outra cobrança" para um valor adicional.`);
      }
      payment = await this.prisma.$transaction(async (tx) => {
        const fee = await tx.monthlyFee.create({
          data: { studentId: student.id, month, year, amount: dto.amount, dueDate, description: descricao },
        });
        return tx.payment.create({
          data: { studentId: student.id, monthlyFeeId: fee.id, amount: dto.amount, status: 'PENDING', dueDate, notes: descricao },
          include: { student: { select: { firstName: true, lastName: true } }, monthlyFee: { select: { month: true, year: true } } },
        });
      });
    } else {
      if (!descricao) throw new BadRequestException('Indique a descrição da cobrança');
      payment = await this.prisma.payment.create({
        data: { studentId: student.id, amount: dto.amount, status: 'PENDING', dueDate, notes: descricao },
        include: { student: { select: { firstName: true, lastName: true } }, monthlyFee: { select: { month: true, year: true } } },
      });
    }

    await this.audit.log({
      userId: actorUserId,
      action: 'PAYMENT_CRIADO',
      entity: 'Payment',
      entityId: payment.id,
      newValues: { tipo, studentId: payment.studentId, amount: payment.amount, dueDate: payment.dueDate, ...(tipo === 'MENSALIDADE' && { month: dto.month, year: dto.year }) },
    });

    return payment;
  }

  /**
   * Regista o pagamento (ADMIN / ASSISTENTE_ADMIN), emite o número de recibo e avisa o atleta e os encarregados.
   * Um pagamento já pago ou cancelado não pode ser registado de novo.
   */
  async markAsPaid(id: string, method: string, actorUserId?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    if (payment.status === 'PAID') {
      throw new ConflictException(`Este pagamento já foi registado como pago${payment.receiptNumber ? ` (recibo ${payment.receiptNumber})` : ''}.`);
    }
    if (payment.status === 'CANCELLED') throw new ConflictException('Este pagamento foi cancelado e não pode ser registado como pago.');

    const receiptNumber = payment.receiptNumber || `REC-${Date.now()}-${id.slice(0, 6).toUpperCase()}`;
    // A condição no update evita registar duas vezes o mesmo pagamento em pedidos simultâneos.
    const res = await this.prisma.payment.updateMany({
      where: { id, status: { notIn: ['PAID', 'CANCELLED'] } },
      data: { status: 'PAID', method: method || 'CASH', paidAt: new Date(), receiptNumber },
    });
    if (res.count === 0) throw new ConflictException('Este pagamento já foi registado por outra pessoa.');
    const updated = await this.prisma.payment.findUniqueOrThrow({ where: { id } });

    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId,
        action: 'PAYMENT_PAGO',
        entity: 'Payment',
        entityId: id,
        oldValues: { status: payment.status },
        newValues: { status: 'PAID', method: updated.method, receiptNumber },
      });
    }

    const aviso = await this.notificarPagamentoRecebido(id).catch((e) => {
      this.logger.warn(`Falha ao notificar pagamento ${id}: ${e?.message || e}`);
      return { notificados: 0, emailsEnviados: 0, semEmail: true };
    });

    return { ...updated, recibo: { numero: receiptNumber, ...aviso } };
  }

  private async carregarPagamentoParaRecibo(id: string) {
    const p = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, userId: true,
            pacote: { select: { nome: true } },
            unidade: { select: { nome: true } },
            user: userLite,
            parents: { select: { parent: { select: { userId: true, user: userLite } } } },
          },
        },
        monthlyFee: { select: { month: true, year: true, description: true } },
      },
    });
    if (!p) throw new NotFoundException('Pagamento não encontrado');
    return p;
  }

  /** Avisa na app (e por email com o recibo, se houver email real) o atleta e todos os encarregados. */
  private async notificarPagamentoRecebido(id: string) {
    const p = await this.carregarPagamentoParaRecibo(id);
    const nome = `${p.student.firstName} ${p.student.lastName}`.trim();
    const destinatarios = destinatariosDoAtleta(p.student);
    const dataPag = (p.paidAt ?? new Date()).toLocaleDateString('pt-PT');
    const titulo = '✅ Pagamento recebido';
    const corpo = `Recebemos MT ${p.amount.toFixed(2)} referente a ${nome}. Recibo n.º ${p.receiptNumber}.`;

    let pdf: Buffer | null = null;
    let emailsEnviados = 0;
    for (const d of destinatarios) {
      const notif = await this.notifService.createForUser(d.userId, 'PAYMENT_RECEIVED', titulo, corpo, JSON.stringify({ paymentId: p.id }));
      this.gateway.sendToUser(d.userId, 'notification', notif);
      if (d.email) {
        pdf ??= await this.gerarReciboPdf(p);
        if (await this.email.sendRecibo(d.email, nome, p.receiptNumber!, p.amount, dataPag, pdf).catch(() => false)) emailsEnviados++;
      }
    }
    return { notificados: destinatarios.length, emailsEnviados, semEmail: !destinatarios.some((d) => d.email) };
  }

  /** PDF do recibo para a equipa administrativa/financeira. */
  async reciboPdf(id: string): Promise<{ buffer: Buffer; numero: string }> {
    const p = await this.carregarPagamentoParaRecibo(id);
    if (p.status !== 'PAID' || !p.receiptNumber) throw new BadRequestException('Só existe recibo depois de o pagamento ser registado como pago.');
    return { buffer: await this.gerarReciboPdf(p), numero: p.receiptNumber };
  }

  /** PDF do recibo para o próprio atleta ou um encarregado dele. Qualquer outro utilizador recebe 404. */
  async reciboPdfDoUtilizador(userId: string, id: string): Promise<{ buffer: Buffer; numero: string }> {
    const p = await this.carregarPagamentoParaRecibo(id);
    const dono = p.student.userId === userId || p.student.parents.some((sp) => sp.parent?.userId === userId);
    if (!dono) throw new NotFoundException('Pagamento não encontrado');
    if (p.status !== 'PAID' || !p.receiptNumber) throw new BadRequestException('Este pagamento ainda não tem recibo.');
    return { buffer: await this.gerarReciboPdf(p), numero: p.receiptNumber };
  }

  private async gerarReciboPdf(p: Awaited<ReturnType<FinancialService['carregarPagamentoParaRecibo']>>): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 420]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();
    const green = rgb(0.02, 0.47, 0.34);
    const dark = rgb(0.07, 0.07, 0.07);
    const gray = rgb(0.45, 0.45, 0.45);
    // As fontes padrão do PDF só suportam WinAnsi: remove caracteres fora desse conjunto.
    const t = (v: string) => v.replace(/[—–]/g, '-').replace(/[^\x20-\x7E -ÿ]/g, '');

    page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: green });
    page.drawText('Mastchieve - Recibo de Pagamento', { x: 40, y: height - 40, size: 17, font: bold, color: rgb(1, 1, 1) });
    page.drawText(t(`N.º ${p.receiptNumber}`), { x: 40, y: height - 58, size: 10, font, color: rgb(0.85, 1, 0.92) });

    const nome = `${p.student.firstName} ${p.student.lastName}`.trim();
    const referente = p.monthlyFee
      ? `Mensalidade de ${MESES[p.monthlyFee.month - 1]} ${p.monthlyFee.year}${p.student.pacote?.nome ? ` (${p.student.pacote.nome})` : ''}`
      : p.notes?.split('\n')[0]?.slice(0, 70) || 'Pagamento';
    const linhas: [string, string][] = [
      ['Atleta', nome],
      ['Referente a', referente],
      ['Valor pago', `MT ${p.amount.toFixed(2)}`],
      ['Método', METODO_LABEL[p.method] ?? p.method],
      ['Data do pagamento', (p.paidAt ?? new Date()).toLocaleDateString('pt-PT')],
      ['Vencimento', new Date(p.dueDate).toLocaleDateString('pt-PT')],
    ];
    if (p.reference) linhas.push(['Referência', p.reference]);
    if (p.student.unidade?.nome) linhas.push(['Unidade', p.student.unidade.nome]);

    let y = height - 110;
    for (const [k, v] of linhas) {
      page.drawText(t(k), { x: 40, y, size: 10, font, color: gray });
      page.drawText(t(v).slice(0, 80), { x: 180, y, size: 11, font: k === 'Valor pago' ? bold : font, color: dark });
      y -= 24;
    }
    page.drawLine({ start: { x: 40, y: 70 }, end: { x: width - 40, y: 70 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
    page.drawText(t(`Emitido em ${new Date().toLocaleString('pt-PT')}`), { x: 40, y: 52, size: 8, font, color: gray });
    page.drawText(t('Mastchieve Serviços, EI · Rua do Capelo, 109, 3º andar · NUIT: 105522126'), { x: 40, y: 38, size: 8, font, color: gray });

    return Buffer.from(await doc.save());
  }

  async grantIsencao(id: string, motivo: string, actorUserId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { isento: true, isencaoMotivo: motivo, isencaoAutorizadoPorId: actorUserId, isencaoAutorizadoEm: new Date() },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'PAYMENT_ISENCAO_CONCEDIDA',
      entity: 'Payment',
      entityId: id,
      newValues: { isento: true, isencaoMotivo: motivo },
    });

    return updated;
  }

  async createMonthlyFeeForStudent(studentId: string, month: number, year: number, amount?: number) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId }, include: { pacote: { select: { preco: true } } } });
    if (!student) throw new NotFoundException('Atleta não encontrado');
    // Sem valor indicado, usa o preço do pacote do atleta.
    if (amount === undefined || amount === null || `${amount}` === '') amount = student.pacote?.preco;
    amount = Number(amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Indique o valor ou atribua um pacote ao atleta.');

    const existing = await this.prisma.monthlyFee.findUnique({
      where: { studentId_month_year: { studentId, month, year } },
    });
    if (existing) throw new ConflictException('Mensalidade já existe para este atleta neste mês');

    const dueDate = new Date(year, month - 1, 10);
    const fee = await this.prisma.monthlyFee.create({ data: { studentId, month, year, amount, dueDate } });
    const payment = await this.prisma.payment.create({
      data: { studentId, monthlyFeeId: fee.id, amount, status: 'PENDING', dueDate },
    });
    return { fee, payment };
  }

  async registerCashCount(
    data: { unidadeId?: string; data?: string | Date; valorContado: number; observacoes?: string },
    actorUserId: string,
  ) {
    const dataRef = data.data ? new Date(data.data) : new Date();
    const dayStart = new Date(dataRef);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const paidCash = await this.prisma.payment.aggregate({
      where: {
        status: 'PAID',
        method: 'CASH',
        paidAt: { gte: dayStart, lt: dayEnd },
        ...(data.unidadeId ? { student: { unidadeId: data.unidadeId } } : {}),
      },
      _sum: { amount: true },
    });
    const valorEsperado = paidCash._sum.amount || 0;
    const diferenca = data.valorContado - valorEsperado;

    const conferencia = await this.prisma.conferenciaCaixa.create({
      data: {
        unidadeId: data.unidadeId,
        data: dayStart,
        valorEsperado,
        valorContado: data.valorContado,
        diferenca,
        observacoes: data.observacoes,
        responsavelId: actorUserId,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CONFERENCIA_CAIXA_REGISTADA',
      entity: 'ConferenciaCaixa',
      entityId: conferencia.id,
      newValues: { valorEsperado, valorContado: data.valorContado, diferenca },
    });

    if (Math.abs(diferenca) > CASH_DISCREPANCY_THRESHOLD) {
      const title = `⚠️ Diferença de caixa: MT ${diferenca.toFixed(2)}`;
      const body = `Contado MT ${data.valorContado.toFixed(2)} vs. esperado MT ${valorEsperado.toFixed(2)} em ${dayStart.toLocaleDateString('pt-PT')}.`;
      await this.notifService.createForRole('ADMIN', 'CASH_DISCREPANCY', title, body);
      this.gateway.broadcastToRole('ADMIN', 'notification', { type: 'CASH_DISCREPANCY', title, body });
    }

    return conferencia;
  }

  async listCashCounts(unidadeId?: string) {
    return this.prisma.conferenciaCaixa.findMany({
      where: unidadeId ? { unidadeId } : undefined,
      orderBy: { data: 'desc' },
      include: { responsavel: { select: { email: true } } },
    });
  }

  /**
   * Gera as mensalidades do mês para os atletas activos. Cada atleta paga o preço do seu pacote;
   * quem não tem pacote paga o valor indicado (sem valor indicado, fica de fora e é contado em semValor).
   */
  async generateMonthlyFees(month: number, year: number, amount?: number) {
    month = Number(month);
    year = Number(year);
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new BadRequestException('Mês ou ano inválido.');
    }
    const valorPadrao = amount !== undefined && amount !== null && `${amount}` !== '' ? Number(amount) : undefined;
    if (valorPadrao !== undefined && (!Number.isFinite(valorPadrao) || valorPadrao < 0)) throw new BadRequestException('Valor inválido.');

    const students = await this.prisma.student.findMany({
      where: { isActive: true },
      select: { id: true, pacote: { select: { nome: true, preco: true } } },
    });
    const dueDate = new Date(year, month - 1, 10);
    let created = 0;
    let comPacote = 0;
    let semValor = 0;

    for (const s of students) {
      const valor = s.pacote ? s.pacote.preco : valorPadrao;
      if (valor === undefined || !(valor > 0)) { semValor++; continue; }
      const existing = await this.prisma.monthlyFee.findUnique({
        where: { studentId_month_year: { studentId: s.id, month, year } },
      });
      if (existing) continue;
      const description = s.pacote ? `Mensalidade — ${s.pacote.nome}` : undefined;
      await this.prisma.$transaction(async (tx) => {
        const fee = await tx.monthlyFee.create({ data: { studentId: s.id, month, year, amount: valor, dueDate, description } });
        await tx.payment.create({
          data: { studentId: s.id, monthlyFeeId: fee.id, amount: valor, status: 'PENDING', dueDate, notes: description },
        });
      });
      created++;
      if (s.pacote) comPacote++;
    }
    return { created, comPacote, semValor, total: students.length, month, year };
  }

  async getFinancialSummary(year: number) {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    const [totalRevenue, overduePayments, pendingPayments, paymentsInYear, folhasPagas] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: yearStart, lt: yearEnd } },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({ where: { status: 'OVERDUE' } }),
      this.prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.findMany({
        where: {
          OR: [
            { status: 'PAID', paidAt: { gte: yearStart, lt: yearEnd } },
            { status: { in: ['PENDING', 'OVERDUE'] }, dueDate: { gte: yearStart, lt: yearEnd } },
          ],
        },
        select: { amount: true, status: true, paidAt: true, dueDate: true },
      }),
      this.prisma.folhaPagamento.findMany({
        where: { estado: 'PAGA', ano: year },
        select: { mes: true, valorLiquido: true },
      }),
    ]);

    const monthlyPayments = Array.from({ length: 12 }, () => ({ paid: 0, pending: 0 }));
    for (const p of paymentsInYear) {
      if (p.status === 'PAID' && p.paidAt) {
        monthlyPayments[p.paidAt.getMonth()].paid += p.amount;
      } else {
        monthlyPayments[p.dueDate.getMonth()].pending += p.amount;
      }
    }

    const monthlyCustosPessoal = Array.from({ length: 12 }, () => 0);
    for (const f of folhasPagas) {
      monthlyCustosPessoal[f.mes - 1] += f.valorLiquido;
    }

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      paid: monthlyPayments[i].paid,
      pending: monthlyPayments[i].pending,
      custosPessoal: monthlyCustosPessoal[i],
    }));

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      overduePayments,
      pendingAmount: pendingPayments._sum.amount || 0,
      pendingCount: pendingPayments._count,
      custosPessoal: monthlyCustosPessoal.reduce((sum, v) => sum + v, 0),
      monthlyData,
    };
  }

  async getStudentBalance(studentId: string) {
    const [paid, pending, overdue] = await Promise.all([
      this.prisma.payment.aggregate({ where: { studentId, status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.payment.aggregate({ where: { studentId, status: 'PENDING' }, _sum: { amount: true }, _count: true }),
      this.prisma.payment.aggregate({ where: { studentId, status: 'OVERDUE' }, _sum: { amount: true }, _count: true }),
    ]);
    return {
      paidAmount: paid._sum.amount || 0,
      pendingAmount: pending._sum.amount || 0,
      overdueAmount: overdue._sum.amount || 0,
      pendingCount: pending._count,
      overdueCount: overdue._count,
    };
  }

  async sendReminders() {
    const overdue = await this.prisma.payment.findMany({
      where: { status: 'OVERDUE' },
      include: {
        student: {
          include: {
            user: { select: { email: true } },
            parents: { include: { parent: { include: { user: { select: { email: true } } } } } },
          },
        },
        monthlyFee: { select: { month: true, year: true } },
      },
    });

    let sent = 0;
    for (const p of overdue) {
      const primaryParent = p.student?.parents.find((sp) => sp.isPrimary)?.parent ?? p.student?.parents[0]?.parent;
      const email = p.student?.user?.email || primaryParent?.user?.email;
      if (!email) continue;
      const name = `${p.student.firstName} ${p.student.lastName}`;
      const dueStr = new Date(p.dueDate).toLocaleDateString('pt-PT');
      try {
        await this.email.sendPaymentReminder(email, name, p.amount, dueStr);
        sent++;
      } catch (e) {
        this.logger.warn(`Failed to send reminder to ${email}: ${e.message}`);
      }
    }
    return { sent, total: overdue.length };
  }

  async exportPdf(year: number): Promise<Buffer> {
    const payments = await this.prisma.payment.findMany({
      where: {
        dueDate: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
      },
      include: { student: { select: { firstName: true, lastName: true } } },
      orderBy: { dueDate: 'asc' },
    });

    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();

    const blue = rgb(0.1, 0.33, 0.86);
    const dark = rgb(0.07, 0.07, 0.07);
    const gray = rgb(0.45, 0.45, 0.45);

    // Header bar
    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: blue });
    page.drawText('Mastchieve — Relatório Financeiro', {
      x: 40, y: height - 45, size: 18, font: fontBold, color: rgb(1, 1, 1),
    });
    page.drawText(`Ano ${year}  ·  Gerado em ${new Date().toLocaleDateString('pt-PT')}`, {
      x: 40, y: height - 65, size: 10, font, color: rgb(0.8, 0.85, 1),
    });

    // Table header
    let y = height - 110;
    const cols = [40, 220, 320, 400, 480];
    const headers = ['Atleta', 'Valor', 'Vencimento', 'Estado'];
    headers.forEach((h, i) => {
      page.drawText(h, { x: cols[i], y, size: 9, font: fontBold, color: gray });
    });
    y -= 6;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
    y -= 16;

    const statusPt: Record<string, string> = { PAID: 'Pago', PENDING: 'Pendente', OVERDUE: 'Em atraso', CANCELLED: 'Cancelado' };
    const statusColor: Record<string, any> = {
      PAID: rgb(0.06, 0.63, 0.42),
      PENDING: rgb(0.85, 0.60, 0.0),
      OVERDUE: rgb(0.85, 0.15, 0.15),
      CANCELLED: rgb(0.5, 0.5, 0.5),
    };

    for (const p of payments) {
      if (y < 60) break;
      const name = `${p.student?.firstName ?? ''} ${p.student?.lastName ?? ''}`.trim();
      page.drawText(name.slice(0, 28), { x: cols[0], y, size: 9, font, color: dark });
      page.drawText(`MT ${p.amount.toFixed(2)}`, { x: cols[1], y, size: 9, font, color: dark });
      page.drawText(new Date(p.dueDate).toLocaleDateString('pt-PT'), { x: cols[2], y, size: 9, font, color: dark });
      page.drawText(statusPt[p.status] ?? p.status, {
        x: cols[3], y, size: 9, font: fontBold, color: statusColor[p.status] ?? gray,
      });
      y -= 18;
      page.drawLine({ start: { x: 40, y: y + 8 }, end: { x: width - 40, y: y + 8 }, thickness: 0.3, color: rgb(0.93, 0.93, 0.93) });
    }

    const bytes = await doc.save();
    return Buffer.from(bytes);
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async markOverduePayments() {
    const updated = await this.prisma.payment.updateMany({
      where: { status: 'PENDING', dueDate: { lt: new Date() }, isento: false },
      data: { status: 'OVERDUE' },
    });
    this.logger.log(`Marked ${updated.count} payments as overdue`);
  }
}
