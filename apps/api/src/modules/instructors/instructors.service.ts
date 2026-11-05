import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { isEmail } from 'class-validator';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { EmailService } from '../email/email.service';
import { gerarTokenReset, VALIDADE_CONVITE_MS } from '../../common/utils/reset-token.util';
import { CreateInstructorDto } from './dto/create-instructor.dto';

const GESTAO_ROLES = ['ADMIN', 'ASSISTENTE_ADMIN', 'SUPER_ADMIN'];
// Campos que um instrutor pode alterar no próprio perfil.
const CAMPOS_PROPRIO_PERFIL = ['firstName', 'lastName', 'phone', 'bio', 'specializations'];
// Campos que o staff de gestão pode alterar; email e unidades são tratados à parte.
const CAMPOS_GESTAO = [...CAMPOS_PROPRIO_PERFIL, 'email', 'unidadeId', 'unidadeIds'];

@Injectable()
export class InstructorsService {
  constructor(private prisma: PrismaService, private audit: AuditService, private email: EmailService) {}

  /** Instrutor só gere o próprio perfil; staff de gestão gere qualquer um. */
  private async assertPodeGerir(id: string, actor: { id: string; role: string }) {
    if (GESTAO_ROLES.includes(actor.role)) return;
    const own = await this.prisma.instructor.findUnique({ where: { userId: actor.id }, select: { id: true } });
    if (!own || own.id !== id) throw new ForbiddenException('Só podes alterar o teu próprio perfil');
  }

  /** Lista leve de todos os instrutores activos, de todas as unidades. */
  async options() {
    const rows = await this.prisma.instructor.findMany({
      where: { isActive: true },
      orderBy: { firstName: 'asc' },
      select: {
        id: true, firstName: true, lastName: true, avatarUrl: true,
        unidades: { select: { isPrimary: true, unidade: { select: { id: true, nome: true, codigo: true } } } },
      },
    });
    return rows.map((i) => ({
      ...i,
      unidades: i.unidades.map((u) => ({ ...u.unidade, isPrimary: u.isPrimary })),
    }));
  }

  async findAll(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const where: any = {};
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true' || query.isActive === true;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.instructor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { firstName: 'asc' },
        include: {
          user: { select: { id: true, email: true, lastLoginAt: true, isActive: true } },
          classes: {
            where: { status: 'ACTIVE' },
            select: { id: true, name: true, level: true },
          },
          turmasAtribuidas: {
            where: { class: { status: 'ACTIVE' } },
            select: { papel: true, class: { select: { id: true, name: true, level: true } } },
          },
          unidades: { include: { unidade: { select: { id: true, nome: true, codigo: true } } } },
          _count: { select: { feedbacks: true } },
        },
      }),
      this.prisma.instructor.count({ where }),
    ]);

    return {
      data: data.map((i) => {
        const primary = i.unidades.find((u) => u.isPrimary) ?? i.unidades[0];
        const classes = [...i.classes];
        for (const t of i.turmasAtribuidas) {
          if (!classes.some((c) => c.id === t.class.id)) classes.push(t.class);
        }
        return {
          ...i,
          classes,
          turmasAtribuidas: undefined,
          specializations: (() => { try { return JSON.parse(i.specializations); } catch { return []; } })(),
          classCount: classes.length,
          feedbackCount: i._count.feedbacks,
          unidade: primary?.unidade ?? null,
        };
      }),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const inst = await this.prisma.instructor.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, lastLoginAt: true, isActive: true } },
        classes: {
          include: {
            enrollments: { where: { isActive: true }, select: { id: true } },
            _count: { select: { enrollments: true } },
          },
          orderBy: { name: 'asc' },
        },
        feedbacks: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, createdAt: true },
        },
        unidades: { include: { unidade: { select: { id: true, nome: true, codigo: true } } } },
        _count: { select: { feedbacks: true } },
      },
    });
    if (!inst) throw new NotFoundException('Instrutor não encontrado');
    const primary = inst.unidades.find((u) => u.isPrimary) ?? inst.unidades[0];
    return {
      ...inst,
      specializations: (() => { try { return JSON.parse(inst.specializations); } catch { return []; } })(),
      feedbackCount: inst._count.feedbacks,
      unidade: primary?.unidade ?? null,
      classes: inst.classes.map((c) => ({
        ...c,
        schedules: (() => { try { return JSON.parse(c.schedules); } catch { return []; } })(),
        enrolledCount: c.enrollments.length,
      })),
    };
  }

  async update(id: string, dto: any, actor?: { id: string; role: string }) {
    if (actor) await this.assertPodeGerir(id, actor);
    const atual = await this.findOne(id);
    const permitidos = !actor || GESTAO_ROLES.includes(actor.role) ? CAMPOS_GESTAO : CAMPOS_PROPRIO_PERFIL;
    const data: any = Object.fromEntries(Object.entries(dto ?? {}).filter(([k]) => permitidos.includes(k)));
    for (const campo of ['firstName', 'lastName']) {
      if (campo in data && !String(data[campo] ?? '').trim()) throw new BadRequestException('O nome e o apelido são obrigatórios');
    }
    if (Array.isArray(data.specializations)) {
      data.specializations = JSON.stringify(data.specializations);
    }
    const novoEmail = typeof data.email === 'string' ? data.email.trim().toLowerCase() : undefined;
    delete data.email;
    const mudaEmail = !!novoEmail && novoEmail !== atual.user.email.toLowerCase();
    if (mudaEmail) await this.assertEmailDeInstrutor(atual.userId, novoEmail!);
    const unidadeId: string | undefined = data.unidadeId;
    const unidadeIds: string[] | undefined = Array.isArray(data.unidadeIds) ? data.unidadeIds : undefined;
    delete data.unidadeId;
    delete data.unidadeIds;

    const updated = await this.prisma.instructor.update({ where: { id }, data });
    if (mudaEmail) await this.prisma.user.update({ where: { id: atual.userId }, data: { email: novoEmail } });

    // Um instrutor pode estar ligado a várias unidades; unidadeId é a principal.
    if (unidadeId || unidadeIds) {
      const todas = Array.from(new Set([...(unidadeIds ?? []), ...(unidadeId ? [unidadeId] : [])]));
      const principal = unidadeId ?? todas[0];
      await this.prisma.$transaction([
        this.prisma.instructorUnidade.deleteMany({ where: { instrutorId: id, unidadeId: { notIn: todas } } }),
        ...todas.map((uid) =>
          this.prisma.instructorUnidade.upsert({
            where: { instrutorId_unidadeId: { instrutorId: id, unidadeId: uid } },
            create: { instrutorId: id, unidadeId: uid, isPrimary: uid === principal },
            update: { isPrimary: uid === principal },
          }),
        ),
      ]);
    }

    if (actor) {
      await this.audit.log({
        userId: actor.id, action: 'INSTRUTOR_ATUALIZADO', entity: 'Instructor', entityId: id,
        oldValues: { firstName: atual.firstName, lastName: atual.lastName, email: atual.user.email },
        newValues: { firstName: updated.firstName, lastName: updated.lastName, email: mudaEmail ? novoEmail : atual.user.email },
      });
    }

    return updated;
  }

  /** O email é o login: só muda em contas de instrutor e nunca para um email já usado. */
  private async assertEmailDeInstrutor(userId: string, email: string) {
    if (!isEmail(email)) throw new BadRequestException('Email inválido');
    const conta = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (conta?.role !== 'INSTRUCTOR') throw new ForbiddenException('O email desta conta só pode ser alterado na Gestão de Utilizadores');
    const emUso = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (emUso && emUso.id !== userId) throw new ConflictException('Este email já está em uso');
  }

  /** Cria a conta com uma palavra-passe aleatória que ninguém conhece; o acesso é dado por gerarAcesso. */
  async create(dto: CreateInstructorDto, actor: { id: string; role: string }) {
    const email = dto.email.trim().toLowerCase();
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    if (!firstName || !lastName) throw new BadRequestException('O nome e o apelido são obrigatórios');
    if (await this.prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      throw new ConflictException('Este email já está em uso');
    }

    const unidades = Array.from(new Set([...(dto.unidadeIds ?? []), ...(dto.unidadeId ? [dto.unidadeId] : [])]));
    const principal = dto.unidadeId ?? unidades[0];
    if (unidades.length && (await this.prisma.unidade.count({ where: { id: { in: unidades } } })) !== unidades.length) {
      throw new BadRequestException('Unidade inválida');
    }

    const password = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
    const inst = await this.prisma.instructor.create({
      data: {
        firstName,
        lastName,
        phone: dto.phone?.trim() || undefined,
        specializations: '[]',
        user: { create: { email, password, role: 'INSTRUCTOR' } },
        unidades: { create: unidades.map((unidadeId) => ({ unidadeId, isPrimary: unidadeId === principal })) },
      },
    });
    await this.audit.log({
      userId: actor.id, action: 'INSTRUTOR_CRIADO', entity: 'Instructor', entityId: inst.id,
      newValues: { firstName, lastName, email, unidades },
    });
    return this.findOne(inst.id);
  }

  /**
   * Link individual para o instrutor definir a própria palavra-passe.
   * Só para contas de instrutor: não pode servir para entrar em contas com mais permissões.
   */
  async gerarAcesso(id: string, actor: { id: string; role: string }) {
    const inst = await this.prisma.instructor.findUnique({
      where: { id },
      select: { firstName: true, isActive: true, user: { select: { id: true, email: true, role: true, isActive: true } } },
    });
    if (!inst) throw new NotFoundException('Instrutor não encontrado');
    if (inst.user.role !== 'INSTRUCTOR') throw new ForbiddenException('Esta conta não tem o perfil de instrutor');
    if (!inst.isActive || !inst.user.isActive) throw new BadRequestException('Activa o instrutor antes de lhe dar acesso');

    const { token, armazenado, expiraEm } = gerarTokenReset(VALIDADE_CONVITE_MS);
    await this.prisma.user.update({ where: { id: inst.user.id }, data: { refreshToken: armazenado } });

    const appUrl = (process.env.APP_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:4300').replace(/\/$/, '');
    // false quando o SMTP não está configurado ou falhou: nunca se assume que o email chegou
    const emailEnviado = await this.email.sendComunicacao(
      inst.user.email,
      'Acesso à plataforma Mastchieve',
      `Olá ${inst.firstName}! Define a tua palavra-passe através deste link, válido durante 72 horas. Depois entra com o email ${inst.user.email}.`,
      `${appUrl}/forgot-password?token=${token}`,
      'Definir palavra-passe',
    ).catch(() => false);

    // O token nunca vai para a auditoria
    await this.audit.log({
      userId: actor.id, action: 'INSTRUTOR_ACESSO_GERADO', entity: 'Instructor', entityId: id,
      newValues: { email: inst.user.email, emailEnviado, expiraEm },
    });
    return { token, email: inst.user.email, expiraEm, emailEnviado };
  }

  async setAvatar(id: string, file: Express.Multer.File, actor: { id: string; role: string }) {
    try {
      await this.assertPodeGerir(id, actor);
    } catch (e) {
      await this.apagarFicheiro(`/uploads/${file.filename}`);
      throw e;
    }
    const inst = await this.prisma.instructor.findUnique({ where: { id }, select: { avatarUrl: true } });
    if (!inst) {
      await this.apagarFicheiro(`/uploads/${file.filename}`);
      throw new NotFoundException('Instrutor não encontrado');
    }
    const avatarUrl = `/uploads/${file.filename}`;
    const updated = await this.prisma.instructor.update({ where: { id }, data: { avatarUrl }, select: { id: true, avatarUrl: true } });
    if (inst.avatarUrl && inst.avatarUrl !== avatarUrl) await this.apagarFicheiro(inst.avatarUrl);
    await this.audit.log({
      userId: actor.id, action: 'INSTRUTOR_FOTO_ATUALIZADA', entity: 'Instructor', entityId: id,
      oldValues: { avatarUrl: inst.avatarUrl }, newValues: { avatarUrl },
    });
    return updated;
  }

  async removeAvatar(id: string, actor: { id: string; role: string }) {
    await this.assertPodeGerir(id, actor);
    const inst = await this.prisma.instructor.findUnique({ where: { id }, select: { avatarUrl: true } });
    if (!inst) throw new NotFoundException('Instrutor não encontrado');
    const updated = await this.prisma.instructor.update({ where: { id }, data: { avatarUrl: null }, select: { id: true, avatarUrl: true } });
    if (inst.avatarUrl) await this.apagarFicheiro(inst.avatarUrl);
    await this.audit.log({
      userId: actor.id, action: 'INSTRUTOR_FOTO_REMOVIDA', entity: 'Instructor', entityId: id,
      oldValues: { avatarUrl: inst.avatarUrl },
    });
    return updated;
  }

  /** Só apaga ficheiros guardados localmente em /uploads (nunca URLs externas). */
  private async apagarFicheiro(url: string) {
    if (!url?.startsWith('/uploads/') || url.includes('..')) return;
    await unlink(join(process.cwd(), url.replace(/^\//, ''))).catch(() => {});
  }

  async toggleActive(id: string) {
    const inst = await this.prisma.instructor.findUnique({ where: { id }, select: { isActive: true } });
    if (!inst) throw new NotFoundException('Instrutor não encontrado');
    const updated = await this.prisma.instructor.update({
      where: { id },
      data: { isActive: !inst.isActive },
      select: { id: true, isActive: true },
    });
    return updated;
  }

  async sendNotification(id: string, title: string, body: string) {
    const inst = await this.prisma.instructor.findUnique({
      where: { id },
      select: { userId: true, firstName: true },
    });
    if (!inst) throw new NotFoundException('Instrutor não encontrado');
    return this.prisma.notification.create({
      data: { userId: inst.userId, type: 'SYSTEM', title, body },
    });
  }

  async getStats(id: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [classes, feedbacks, students, recentFeedbacks] = await Promise.all([
      this.prisma.class.count({ where: { instructorId: id, status: 'ACTIVE' } }),
      this.prisma.feedback.count({ where: { instructorId: id } }),
      this.prisma.enrollment.count({ where: { class: { instructorId: id }, isActive: true } }),
      this.prisma.feedback.findMany({
        where: { instructorId: id, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Group by month (last 6 months)
    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      months.push({
        month: d.toLocaleString('pt-PT', { month: 'short' }),
        count: 0,
      });
    }
    recentFeedbacks.forEach((f) => {
      const d = new Date(f.createdAt);
      const label = d.toLocaleString('pt-PT', { month: 'short' });
      const entry = months.find((m) => m.month === label);
      if (entry) entry.count++;
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentMonthFeedbacks = recentFeedbacks.filter(
      (f) => new Date(f.createdAt) >= thirtyDaysAgo,
    ).length;

    return { classes, feedbacks, students, feedbacksByMonth: months, recentMonthFeedbacks };
  }
}
