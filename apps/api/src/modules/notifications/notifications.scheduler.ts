import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { calcularStatusInstrutor } from '../administrativo/rotina-diaria/rotina-diaria-status.util';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notifService: NotificationsService,
    private gateway: NotificationsGateway,
    private whatsappService: WhatsappService,
  ) {}

  private async notifyRoleOnce(role: string, type: string, title: string, body: string, dedupeHours = 24) {
    const existing = await this.prisma.notification.findFirst({
      where: {
        type: type as any,
        title,
        createdAt: { gte: new Date(Date.now() - dedupeHours * 3600000) },
      },
    });
    if (existing) return;
    await this.notifService.createForRole(role, type, title, body);
    this.gateway.broadcastToRole(role, 'notification', { type, title, body });
  }

  // Runs every day at 08:00
  @Cron('0 8 * * *')
  async checkPaymentsDue() {
    this.logger.log('Checking payments due soon...');
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pending = await this.prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: { gte: today, lte: in3Days },
        isento: false,
      },
      include: { student: { include: { user: true } } },
    });

    for (const p of pending) {
      if (!p.student?.user?.id) continue;
      const daysLeft = Math.ceil((new Date(p.dueDate).getTime() - today.getTime()) / 86400000);
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: p.student.user.id,
          type: 'PAYMENT_DUE',
          createdAt: { gte: new Date(Date.now() - 86400000) },
        },
      });
      if (existing) continue;

      const notif = await this.notifService.createForUser(
        p.student.user.id,
        'PAYMENT_DUE',
        daysLeft === 0 ? '💰 Mensalidade vence hoje!' : `💰 Mensalidade vence em ${daysLeft} dia(s)`,
        `O valor de MT ${p.amount} deve ser pago até ${new Date(p.dueDate).toLocaleDateString('pt-PT')}.`,
      );
      this.gateway.sendToUser(p.student.user.id, 'notification', notif);
    }

    // Overdue payments
    const overdue = await this.prisma.payment.findMany({
      where: { status: 'PENDING', dueDate: { lt: today }, isento: false },
      include: { student: { include: { user: true } } },
    });

    for (const p of overdue) {
      if (!p.student?.user?.id) continue;
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: p.student.user.id,
          type: 'PAYMENT_DUE',
          createdAt: { gte: new Date(Date.now() - 3 * 86400000) },
        },
      });
      if (existing) continue;

      await this.prisma.payment.update({ where: { id: p.id }, data: { status: 'OVERDUE' } });
      const notif = await this.notifService.createForUser(
        p.student.user.id,
        'PAYMENT_DUE',
        '⚠️ Mensalidade em atraso',
        `A mensalidade de MT ${p.amount} está em atraso desde ${new Date(p.dueDate).toLocaleDateString('pt-PT')}. Por favor regulariza a situação.`,
      );
      this.gateway.sendToUser(p.student.user.id, 'notification', notif);
    }
  }

  // Runs every day at 09:00
  @Cron('0 9 * * *')
  async checkAttendance() {
    this.logger.log('Checking low attendance...');
    const students = await this.prisma.student.findMany({
      include: { user: true },
      where: { user: { isActive: true } },
    });

    for (const student of students) {
      const total = await this.prisma.attendance.count({ where: { studentId: student.id } });
      if (total < 3) continue;
      const present = await this.prisma.attendance.count({ where: { studentId: student.id, status: 'PRESENT' } });
      const rate = Math.round((present / total) * 100);

      if (rate < 70) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId: student.user.id,
            type: 'ATTENDANCE_ALERT',
            createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
          },
        });
        if (existing) continue;

        const notif = await this.notifService.createForUser(
          student.user.id,
          'ATTENDANCE_ALERT',
          '📉 Assiduidade abaixo do esperado',
          `A tua taxa de presença é ${rate}%. Tenta não faltar para manteres o progresso nos módulos!`,
        );
        this.gateway.sendToUser(student.user.id, 'notification', notif);
      }
    }
  }

  // Runs every day at 08:30 — inscrições com documentos pendentes há mais de 5 dias (P02)
  @Cron('30 8 * * *')
  async checkPendingRegistrations() {
    this.logger.log('Checking pending registrations...');
    const limite = new Date();
    limite.setDate(limite.getDate() - 5);

    const pendentes = await this.prisma.student.count({
      where: { estadoInscricao: 'DOCUMENTOS_PENDENTES', enrollmentDate: { lte: limite }, isActive: true },
    });
    if (pendentes === 0) return;

    await this.notifyRoleOnce(
      'ASSISTENTE_ADMIN',
      'REGISTRATION_PENDING',
      `📋 ${pendentes} inscrição(ões) com documentos pendentes há mais de 5 dias`,
      'Consulta a lista de atletas para regularizar a documentação em falta.',
    );
  }

  // Runs every day at 09:15 — 3+ faltas consecutivas (P03)
  @Cron('15 9 * * *')
  async checkConsecutiveAbsences() {
    this.logger.log('Checking consecutive absences...');
    const students = await this.prisma.student.findMany({
      where: { isActive: true },
      include: { parents: { where: { isPrimary: true }, include: { parent: true } } },
    });

    for (const student of students) {
      const lastRecords = await this.prisma.attendance.findMany({
        where: { studentId: student.id },
        orderBy: { markedAt: 'desc' },
        take: 3,
      });
      if (lastRecords.length < 3 || !lastRecords.every((r) => r.status === 'ABSENT')) continue;

      const title = `🚨 ${student.firstName} ${student.lastName} — 3+ faltas consecutivas`;
      const existing = await this.prisma.notification.findFirst({
        where: { type: 'CONSECUTIVE_ABSENCES', title, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      });
      if (existing) continue;

      const body = 'Contacta o encarregado para perceber o motivo das faltas e regista o contacto.';
      await this.notifyRoleOnce('ASSISTENTE_ADMIN', 'CONSECUTIVE_ABSENCES', title, body, 24);
      await this.notifyRoleOnce('ADMIN', 'CONSECUTIVE_ABSENCES', title, body, 24);

      const primary = student.parents[0]?.parent;
      if (primary?.phone) {
        await this.whatsappService.enqueue({
          tipo: 'FALTAS_CONSECUTIVAS',
          telefone: primary.phone,
          mensagem: `Olá ${primary.firstName}, notamos que ${student.firstName} tem faltado às últimas 3 aulas seguidas. Podemos ajudar? Contacte-nos para regularizar a situação.`,
          studentId: student.id,
        });
      }
    }
  }

  // Runs every day at 08:45 — pedidos de comunicação com prazo ultrapassado sem publicação (P06)
  @Cron('45 8 * * *')
  async checkComunicacaoPrazo() {
    this.logger.log('Checking pedidos de comunicação com prazo ultrapassado...');
    const atrasados = await this.prisma.pedidoComunicacao.count({
      where: { prazo: { lt: new Date() }, estado: { notIn: ['PUBLICADO', 'CANCELADO'] } },
    });
    if (atrasados === 0) return;

    const title = `📢 ${atrasados} pedido(s) de comunicação com prazo ultrapassado`;
    const body = 'Consulta a lista de comunicação para regularizar os pedidos pendentes.';
    await this.notifyRoleOnce('MANAGER', 'COMUNICACAO_PRAZO', title, body);
    await this.notifyRoleOnce('ASSISTENTE_ADMIN', 'COMUNICACAO_PRAZO', title, body);
    await this.notifyRoleOnce('ADMIN', 'COMUNICACAO_PRAZO', title, body);
  }

  // Runs every day at 08:50 — atendimentos a encarregados com prazo de resposta ultrapassado (P06)
  @Cron('50 8 * * *')
  async checkAtendimentoPrazo() {
    this.logger.log('Checking atendimentos com prazo de resposta ultrapassado...');
    const atrasados = await this.prisma.atendimentoEncarregado.count({
      where: { prazoResposta: { lt: new Date() }, estado: { not: 'RESOLVIDO' } },
    });
    if (atrasados === 0) return;

    const title = `📞 ${atrasados} atendimento(s) a encarregados com prazo de resposta ultrapassado`;
    const body = 'Consulta a lista de atendimentos para dar seguimento.';
    await this.notifyRoleOnce('ASSISTENTE_ADMIN', 'ATENDIMENTO_PRAZO', title, body);
    await this.notifyRoleOnce('ADMIN', 'ATENDIMENTO_PRAZO', title, body);
  }

  // Runs every day at 09:10 — avaliações agendadas cuja data já passou sem serem realizadas (P11)
  @Cron('10 9 * * *')
  async checkAvaliacoesAgendadasAtrasadas() {
    this.logger.log('Checking avaliações agendadas atrasadas...');
    const atrasadas = await this.prisma.avaliacaoAgendada.findMany({
      where: { estado: 'AGENDADA', data: { lt: new Date() } },
      include: { instructor: { select: { userId: true } }, class: { select: { name: true } } },
    });

    for (const av of atrasadas) {
      const title = `📋 Avaliação agendada atrasada — ${av.class?.name ?? ''} (${new Date(av.data).toLocaleDateString('pt-PT')})`;
      const existing = await this.prisma.notification.findFirst({
        where: { type: 'AVALIACAO_AGENDADA_ATRASADA', title, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      });
      if (existing) continue;

      const body = 'A avaliação agendada já passou da data e continua por realizar.';
      if (av.instructor?.userId) {
        const notif = await this.notifService.createForUser(av.instructor.userId, 'AVALIACAO_AGENDADA_ATRASADA', title, body);
        this.gateway.sendToUser(av.instructor.userId, 'notification', notif);
      }
      await this.notifyRoleOnce('ADMIN', 'AVALIACAO_AGENDADA_ATRASADA', title, body);
    }
  }

  // Runs every day at 09:20 — módulos em progresso sem avaliação há mais de 30 dias (P11)
  @Cron('20 9 * * *')
  async checkProgressaoEstagnada() {
    this.logger.log('Checking progressão estagnada...');
    const emProgresso = await this.prisma.studentFase.findMany({
      where: { estado: 'EM_PROGRESSO' },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            enrollments: { where: { isActive: true }, take: 1, include: { class: { select: { instructorId: true } } } },
          },
        },
        avaliacoesAgendadas: { orderBy: { avaliadoEm: 'desc' }, take: 1 },
      },
    });

    const limite = new Date();
    limite.setDate(limite.getDate() - 30);

    for (const sf of emProgresso) {
      const ultimaAvaliacao = sf.avaliacoesAgendadas[0]?.avaliadoEm ?? sf.iniciadoEm ?? sf.updatedAt;
      if (!ultimaAvaliacao || ultimaAvaliacao > limite) continue;

      const instructorId = sf.student?.enrollments?.[0]?.class?.instructorId;
      if (!instructorId) continue;
      const instructor = await this.prisma.instructor.findUnique({ where: { id: instructorId }, select: { userId: true } });
      if (!instructor) continue;

      const title = `🐌 Progressão estagnada — ${sf.student.firstName} ${sf.student.lastName}`;
      const existing = await this.prisma.notification.findFirst({
        where: { userId: instructor.userId, type: 'PROGRESSAO_ESTAGNADA', title, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      });
      if (existing) continue;

      const notif = await this.notifService.createForUser(
        instructor.userId,
        'PROGRESSAO_ESTAGNADA',
        title,
        'Sem avaliação há mais de 30 dias. Considera agendar uma nova avaliação.',
      );
      this.gateway.sendToUser(instructor.userId, 'notification', notif);
    }
  }

  // Runs every day at 08:05 — itens de inventário em stock mínimo ou abaixo (P08)
  @Cron('5 8 * * *')
  async checkStockMinimo() {
    this.logger.log('Checking itens de inventário em stock baixo...');
    const itens = await this.prisma.itemInventario.findMany({
      where: { ativo: true },
    });
    const abaixoDoMinimo = itens.filter((i) => i.quantidade <= i.quantidadeMin);
    if (abaixoDoMinimo.length === 0) return;

    const title = `📦 ${abaixoDoMinimo.length} item(ns) de inventário em stock mínimo ou abaixo`;
    const body = abaixoDoMinimo
      .slice(0, 5)
      .map((i) => `${i.nome}: ${i.quantidade}/${i.quantidadeMin} ${i.unidadeMedida}`)
      .join(' · ');
    await this.notifyRoleOnce('ASSISTENTE_ADMIN', 'STOCK_MINIMO', title, body);
    await this.notifyRoleOnce('ADMIN', 'STOCK_MINIMO', title, body);
    await this.notifyRoleOnce('MANAGER', 'STOCK_MINIMO', title, body);
  }

  // Runs every day at 08:15 — checklist de abertura da rotina diária não preenchido (P16)
  @Cron('15 8 * * *')
  async checkRotinaAberturaPendente() {
    await this.checkRotinaPendente('ABERTURA');
  }

  // Runs every day at 21:15 — checklist de fecho da rotina diária não preenchido (P16)
  @Cron('15 21 * * *')
  async checkRotinaFechoPendente() {
    await this.checkRotinaPendente('FECHO');
  }

  private async checkRotinaPendente(tipo: 'ABERTURA' | 'FECHO') {
    this.logger.log(`Checking rotina diária de ${tipo} pendente...`);
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);
    const fimHoje = new Date(inicioHoje);
    fimHoje.setDate(fimHoje.getDate() + 1);

    const unidades = await this.prisma.unidade.findMany({ where: { ativo: true } });
    const pendentes: string[] = [];

    for (const unidade of unidades) {
      const rotina = await this.prisma.rotinaDiaria.findFirst({
        where: { unidadeId: unidade.id, tipo, data: { gte: inicioHoje, lt: fimHoje } },
      });
      if (!rotina?.concluido) pendentes.push(unidade.nome);
    }
    if (pendentes.length === 0) return;

    const label = tipo === 'ABERTURA' ? 'abertura' : 'fecho';
    const title = `🗒️ Checklist de ${label} da rotina diária por preencher — ${pendentes.join(', ')}`;
    const body = `A rotina de ${label} de hoje ainda não foi concluída para ${pendentes.length} unidade(s).`;
    await this.notifyRoleOnce('ASSISTENTE_ADMIN', `ROTINA_${tipo}_PENDENTE`, title, body);
    await this.notifyRoleOnce('ADMIN', `ROTINA_${tipo}_PENDENTE`, title, body);
  }

  // Runs every 30 min from 06:00 to 08:30 — nags each instructor individually (real push) until they
  // complete água/equipamentos/materiais for their unit's ABERTURA routine. Does not nag instructors
  // while AGUARDA_ADMIN (nothing they can do about it) — that gap stays covered by checkRotinaAberturaPendente above.
  @Cron('*/30 6-8 * * *')
  async checkInstrutoresRotinaAberturaPendente() {
    this.logger.log('Checking rotina diária de abertura pendente por instrutor...');
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);
    const fimHoje = new Date(inicioHoje);
    fimHoje.setDate(fimHoje.getDate() + 1);

    const instrutores = await this.prisma.instructor.findMany({
      where: { isActive: true, user: { isActive: true } },
      include: { unidades: true },
    });

    for (const inst of instrutores) {
      const unidade = inst.unidades.find((u) => u.isPrimary) ?? inst.unidades[0];
      if (!unidade) continue;

      const rotina = await this.prisma.rotinaDiaria.findFirst({
        where: { unidadeId: unidade.unidadeId, tipo: 'ABERTURA', data: { gte: inicioHoje, lt: fimHoje } },
        include: { materiais: true },
      });
      const { status, pendentes } = calcularStatusInstrutor(rotina, inst.id);
      if (status !== 'INCOMPLETO') continue;

      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: inst.userId,
          type: 'ROTINA_ABERTURA_INSTRUTOR_PENDENTE',
          createdAt: { gte: new Date(Date.now() - 25 * 60000) },
        },
      });
      if (existing) continue;

      const label: Record<string, string> = { agua: 'água', equipamentos: 'equipamentos', materiais: 'materiais' };
      await this.notifService.createForUser(
        inst.userId,
        'ROTINA_ABERTURA_INSTRUTOR_PENDENTE',
        '🚨 Rotina diária por preencher',
        `Confirma ${pendentes.map((p) => label[p]).join(', ')} antes de continuares a usar o sistema.`,
      );
    }
  }

  // Runs every day at 09:25 — atendimentos de recepção e reclamações com prazo ultrapassado (P01, P10)
  @Cron('25 9 * * *')
  async checkPrazosAdministrativos() {
    this.logger.log('Checking prazos de atendimentos de recepção e reclamações...');
    const [atendimentosAtrasados, reclamacoesAtrasadas] = await Promise.all([
      this.prisma.atendimentoRecepcao.count({
        where: { prazo: { lt: new Date() }, estado: { not: 'RESOLVIDO' } },
      }),
      this.prisma.reclamacao.count({
        where: { prazoResposta: { lt: new Date() }, estado: { notIn: ['RESPONDIDA', 'FECHADA'] } },
      }),
    ]);

    if (atendimentosAtrasados > 0) {
      const title = `📇 ${atendimentosAtrasados} atendimento(s) de recepção com prazo ultrapassado`;
      const body = 'Consulta a lista de atendimentos de recepção para dar seguimento.';
      await this.notifyRoleOnce('ASSISTENTE_ADMIN', 'ATENDIMENTO_RECEPCAO_PRAZO', title, body);
      await this.notifyRoleOnce('ADMIN', 'ATENDIMENTO_RECEPCAO_PRAZO', title, body);
    }

    if (reclamacoesAtrasadas > 0) {
      const title = `📮 ${reclamacoesAtrasadas} reclamação(ões)/sugestão(ões) com prazo de resposta ultrapassado`;
      const body = 'Consulta a lista de reclamações e sugestões para dar seguimento.';
      await this.notifyRoleOnce('ASSISTENTE_ADMIN', 'RECLAMACAO_PRAZO', title, body);
      await this.notifyRoleOnce('ADMIN', 'RECLAMACAO_PRAZO', title, body);
      await this.notifyRoleOnce('MANAGER', 'RECLAMACAO_PRAZO', title, body);
    }
  }

  // Called externally when feedback is sent
  async notifyFeedbackSent(studentUserId: string, feedbackId: string) {
    const notif = await this.notifService.createForUser(
      studentUserId,
      'PERFORMANCE_UPDATE',
      '🧠 Novo feedback da IA disponível!',
      'O teu instrutor reviu e enviou o relatório de desempenho. Clica para ver as recomendações.',
    );
    this.gateway.sendToUser(studentUserId, 'notification', notif);
    return notif;
  }

  // Called when a new performance record is created
  async notifyPerformanceRecorded(studentUserId: string, overallScore: number) {
    const notif = await this.notifService.createForUser(
      studentUserId,
      'PERFORMANCE_UPDATE',
      `⚡ Avaliação registada — Score: ${overallScore}/10`,
      'O teu instrutor registou uma nova avaliação de desempenho. Consulta o teu painel para ver os detalhes.',
    );
    this.gateway.sendToUser(studentUserId, 'notification', notif);
    return notif;
  }
}
