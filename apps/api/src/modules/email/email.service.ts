import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPaymentReminder(to: string, studentName: string, amount: number, dueDate: string) {
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'noreply@mastchieve.com') {
      this.logger.warn(`[EMAIL SKIPPED] Payment reminder to ${to} — SMTP not configured`);
      return;
    }
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM ?? '"Mastchieve" <noreply@mastchieve.com>',
      to,
      subject: '⚠️ Mensalidade em atraso — Mastchieve',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1A3A9C 0%, #1A56DB 100%); padding: 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Mastchieve</h1>
          </div>
          <div style="padding: 32px; background: #f9fafb; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px;">Olá, <strong>${studentName}</strong>!</p>
            <p style="color: #6b7280;">Tens uma mensalidade em atraso:</p>
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280;">Valor:</span>
                <strong style="color: #111827;">€${amount.toFixed(2)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                <span style="color: #6b7280;">Vencimento:</span>
                <strong style="color: #ef4444;">${dueDate}</strong>
              </div>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Por favor, regulariza a situação o mais breve possível para continuares a ter acesso às aulas.</p>
            <a href="${process.env.APP_URL ?? 'http://localhost:4300'}/student/payments"
               style="display: inline-block; background: #1A56DB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
              Ver pagamentos
            </a>
          </div>
        </div>
      `,
    });
    this.logger.log(`Payment reminder sent to ${to}`);
  }

  async sendFeedbackReady(to: string, studentName: string, feedbackPreview: string) {
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'noreply@mastchieve.com') {
      this.logger.warn(`[EMAIL SKIPPED] Feedback ready to ${to} — SMTP not configured`);
      return;
    }
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM ?? '"Mastchieve" <noreply@mastchieve.com>',
      to,
      subject: '🧠 Novo feedback da IA disponível — Mastchieve',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #1A56DB 100%); padding: 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Mastchieve IA</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0;">Relatório de Desempenho</p>
          </div>
          <div style="padding: 32px; background: #f9fafb; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px;">Olá, <strong>${studentName}</strong>!</p>
            <p style="color: #6b7280;">O teu instrutor enviou um novo relatório personalizado pela IA:</p>
            <div style="background: #eff6ff; border-left: 4px solid #1A56DB; padding: 16px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #1e40af; font-style: italic; margin: 0; font-size: 14px;">"${feedbackPreview.slice(0, 200)}..."</p>
            </div>
            <a href="${process.env.APP_URL ?? 'http://localhost:4300'}/student/feedback"
               style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
              Ver relatório completo
            </a>
          </div>
        </div>
      `,
    });
    this.logger.log(`Feedback email sent to ${to}`);
  }

  async sendWelcome(to: string, firstName: string, role: string) {
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'noreply@mastchieve.com') {
      this.logger.warn(`[EMAIL SKIPPED] Welcome to ${to} — SMTP not configured`);
      return;
    }
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM ?? '"Mastchieve" <noreply@mastchieve.com>',
      to,
      subject: '🌊 Bem-vindo à Mastchieve!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0F1F5C 0%, #1A56DB 100%); padding: 40px 32px; border-radius: 12px 12px 0 0; text-align: center;">
            <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              🌊
            </div>
            <h1 style="color: white; margin: 0; font-size: 26px;">Mastchieve</h1>
            <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">Plataforma de Natação com IA</p>
          </div>
          <div style="padding: 32px; background: #f9fafb; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111827;">Bem-vindo(a), ${firstName}! 👋</h2>
            <p style="color: #6b7280;">A tua conta foi criada com sucesso. Estás registado(a) como <strong>${role}</strong>.</p>
            <a href="${process.env.APP_URL ?? 'http://localhost:4300'}/login"
               style="display: inline-block; background: linear-gradient(135deg, #1A3A9C, #1A56DB); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
              Aceder à plataforma
            </a>
          </div>
        </div>
      `,
    });
    this.logger.log(`Welcome email sent to ${to}`);
  }
}
