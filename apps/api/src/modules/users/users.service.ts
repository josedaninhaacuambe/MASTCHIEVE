import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const { page = 1, limit = 20, role, search } = query;
    const where: any = {};
    if (role) where.role = role;
    if (search) where.email = { contains: search };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip: (Number(page) - 1) * Number(limit), take: Number(limit),
        select: { id: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } };
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    return this.prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
  }

  async changeRole(id: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');

    const updated = await this.prisma.user.update({ where: { id }, data: { role } });

    // Create profile record when converting to roles that need one
    if (role === 'STUDENT') {
      const exists = await this.prisma.student.findUnique({ where: { userId: id } });
      if (!exists) {
        const email = user.email;
        const nameParts = email.split('@')[0].split('.');
        await this.prisma.student.create({
          data: {
            userId: id,
            firstName: nameParts[0] ?? 'Novo',
            lastName: nameParts[1] ?? 'Atleta',
            dateOfBirth: new Date('2000-01-01'),
            gender: 'OTHER',
          },
        });
      }
    } else if (role === 'INSTRUCTOR') {
      const exists = await this.prisma.instructor.findUnique({ where: { userId: id } });
      if (!exists) {
        const email = user.email;
        const nameParts = email.split('@')[0].split('.');
        await this.prisma.instructor.create({
          data: { userId: id, firstName: nameParts[0] ?? 'Novo', lastName: nameParts[1] ?? 'Instrutor' },
        });
      }
    }

    const { password, refreshToken, ...safe } = updated as any;
    return safe;
  }

  async getAuditLogs(query: any) {
    const { page = 1, limit = 30, userId, entity, action, search } = query;
    const where: any = {};
    if (userId) where.userId = userId;
    if (entity) where.entity = { contains: entity };
    if (action) where.action = { contains: action };
    if (search) where.OR = [
      { action: { contains: search } },
      { entity: { contains: search } },
      { entityId: { contains: search } },
    ];
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true, role: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, role: true, isActive: true, createdAt: true,
        instructor: { select: { id: true, firstName: true, lastName: true, phone: true, bio: true, specializations: true } },
        student: { select: { id: true, firstName: true, lastName: true, phone: true, dateOfBirth: true, gender: true, medicalNotes: true } },
        parent: { select: { id: true, firstName: true, lastName: true, phone: true } },
        admin: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    return user;
  }

  async updateMe(userId: string, dto: { firstName?: string; lastName?: string; phone?: string; bio?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, instructor: true, student: true, parent: true, admin: true },
    });
    if (!user) throw new NotFoundException('Utilizador não encontrado');

    const { firstName, lastName, phone, bio } = dto;
    const data = { ...(firstName && { firstName }), ...(lastName && { lastName }), ...(phone !== undefined && { phone }) };

    if (user.role === 'INSTRUCTOR' && user.instructor) {
      await this.prisma.instructor.update({ where: { id: user.instructor.id }, data: { ...data, ...(bio !== undefined && { bio }) } });
    } else if (user.role === 'STUDENT' && user.student) {
      await this.prisma.student.update({ where: { id: user.student.id }, data });
    } else if (user.role === 'PARENT' && user.parent) {
      await this.prisma.parent.update({ where: { id: user.parent.id }, data });
    } else if (user.role === 'ADMIN' && user.admin) {
      await this.prisma.admin.update({ where: { id: user.admin.id }, data });
    }

    return this.getMe(userId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new BadRequestException('Palavra-passe actual incorrecta');
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { message: 'Palavra-passe alterada com sucesso' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always return success to prevent user enumeration
    if (!user) return { message: 'Se o email existir, receberá as instruções em breve' };
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    // Store token (using refreshToken field as reset token for simplicity)
    await this.prisma.user.update({ where: { id: user.id }, data: { refreshToken: `reset:${token}` } });
    // In production this would send an email; for now return token in dev
    return { message: 'Se o email existir, receberá as instruções em breve', devToken: process.env.NODE_ENV === 'development' ? token : undefined };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({ where: { refreshToken: `reset:${token}` } });
    if (!user) throw new BadRequestException('Token inválido ou expirado');
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: user.id }, data: { password: hashed, refreshToken: null } });
    return { message: 'Palavra-passe redefinida com sucesso' };
  }
}
