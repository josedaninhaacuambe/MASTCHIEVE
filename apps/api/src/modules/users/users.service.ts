import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const { page = 1, limit = 20, role, search } = query;
    const where: any = {};
    if (role) where.role = role;
    if (search) where.email = { contains: search, mode: 'insensitive' };

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
}
