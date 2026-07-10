"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
const bcrypt = require("bcryptjs");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const { page = 1, limit = 20, role, search } = query;
        const where = {};
        if (role)
            where.role = role;
        if (search)
            where.email = { contains: search };
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
    async toggleActive(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Utilizador não encontrado');
        return this.prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
    }
    async changeRole(id, role) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Utilizador não encontrado');
        const updated = await this.prisma.user.update({ where: { id }, data: { role } });
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
        }
        else if (role === 'INSTRUCTOR') {
            const exists = await this.prisma.instructor.findUnique({ where: { userId: id } });
            if (!exists) {
                const email = user.email;
                const nameParts = email.split('@')[0].split('.');
                await this.prisma.instructor.create({
                    data: { userId: id, firstName: nameParts[0] ?? 'Novo', lastName: nameParts[1] ?? 'Instrutor' },
                });
            }
        }
        const { password, refreshToken, ...safe } = updated;
        return safe;
    }
    async getAuditLogs(query) {
        const { page = 1, limit = 30, userId, entity, action, search } = query;
        const where = {};
        if (userId)
            where.userId = userId;
        if (entity)
            where.entity = { contains: entity };
        if (action)
            where.action = { contains: action };
        if (search)
            where.OR = [
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
    async getMe(userId) {
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
        if (!user)
            throw new common_1.NotFoundException('Utilizador não encontrado');
        return user;
    }
    async updateMe(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, instructor: true, student: true, parent: true, admin: true },
        });
        if (!user)
            throw new common_1.NotFoundException('Utilizador não encontrado');
        const { firstName, lastName, phone, bio } = dto;
        const data = { ...(firstName && { firstName }), ...(lastName && { lastName }), ...(phone !== undefined && { phone }) };
        if (user.role === 'INSTRUCTOR' && user.instructor) {
            await this.prisma.instructor.update({ where: { id: user.instructor.id }, data: { ...data, ...(bio !== undefined && { bio }) } });
        }
        else if (user.role === 'STUDENT' && user.student) {
            await this.prisma.student.update({ where: { id: user.student.id }, data });
        }
        else if (user.role === 'PARENT' && user.parent) {
            await this.prisma.parent.update({ where: { id: user.parent.id }, data });
        }
        else if (user.role === 'ADMIN' && user.admin) {
            await this.prisma.admin.update({ where: { id: user.admin.id }, data });
        }
        return this.getMe(userId);
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Utilizador não encontrado');
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid)
            throw new common_1.BadRequestException('Palavra-passe actual incorrecta');
        const hashed = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
        return { message: 'Palavra-passe alterada com sucesso' };
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            return { message: 'Se o email existir, receberá as instruções em breve' };
        const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
        await this.prisma.user.update({ where: { id: user.id }, data: { refreshToken: `reset:${token}` } });
        return { message: 'Se o email existir, receberá as instruções em breve', devToken: process.env.NODE_ENV === 'development' ? token : undefined };
    }
    async resetPassword(token, newPassword) {
        const user = await this.prisma.user.findFirst({ where: { refreshToken: `reset:${token}` } });
        if (!user)
            throw new common_1.BadRequestException('Token inválido ou expirado');
        const hashed = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({ where: { id: user.id }, data: { password: hashed, refreshToken: null } });
        return { message: 'Palavra-passe redefinida com sucesso' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map