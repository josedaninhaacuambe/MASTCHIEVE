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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../config/prisma/prisma.service");
const bcrypt = require("bcryptjs");
const google_auth_library_1 = require("google-auth-library");
const email_service_1 = require("../email/email.service");
let AuthService = class AuthService {
    constructor(prisma, jwt, config, email) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.email = email;
        this.googleClient = new google_auth_library_1.OAuth2Client(this.config.get('GOOGLE_CLIENT_ID'));
    }
    async register(dto) {
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists)
            throw new common_1.ConflictException('Email já registado');
        const hashed = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashed,
                role: dto.role,
                ...(dto.role === 'ADMIN' && {
                    admin: { create: { firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone } },
                }),
                ...(dto.role === 'INSTRUCTOR' && {
                    instructor: { create: { firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone } },
                }),
                ...(dto.role === 'STUDENT' && {
                    student: {
                        create: {
                            firstName: dto.firstName,
                            lastName: dto.lastName,
                            dateOfBirth: dto.dateOfBirth || new Date(),
                            gender: dto.gender || 'OTHER',
                            phone: dto.phone,
                        },
                    },
                }),
                ...(dto.role === 'PARENT' && {
                    parent: { create: { firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone || '' } },
                }),
            },
        });
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        this.email.sendWelcome(dto.email, dto.firstName, dto.role).catch(() => { });
        return { user: this.sanitizeUser(user), ...tokens };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user)
            throw new common_1.UnauthorizedException('Email não encontrado. Verifica o endereço introduzido.');
        if (!user.isActive)
            throw new common_1.UnauthorizedException('Conta desactivada. Contacta o administrador.');
        const valid = await bcrypt.compare(dto.password, user.password);
        if (!valid)
            throw new common_1.UnauthorizedException('Palavra-passe incorreta. Tenta novamente.');
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        const profile = await this.getUserProfile(user.id, user.role);
        return { user: { ...this.sanitizeUser(user), profile }, ...tokens };
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.refreshToken)
            throw new common_1.UnauthorizedException();
        const matches = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!matches)
            throw new common_1.UnauthorizedException('Refresh token inválido');
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }
    async registerVisitor(dto) {
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists)
            throw new common_1.ConflictException('Email já registado');
        const hashed = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashed,
                role: 'VISITOR',
            },
        });
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        return { user: this.sanitizeUser(user), ...tokens };
    }
    async googleAuth(credential) {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        if (!clientId)
            throw new common_1.BadRequestException('Google OAuth não configurado');
        let payload;
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: credential,
                audience: clientId,
            });
            payload = ticket.getPayload();
        }
        catch {
            throw new common_1.UnauthorizedException('Token Google inválido');
        }
        const { email, given_name, family_name, sub: googleId } = payload;
        if (!email)
            throw new common_1.BadRequestException('Email não disponível na conta Google');
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    password: await bcrypt.hash(googleId, 12),
                    role: 'VISITOR',
                },
            });
        }
        if (!user.isActive)
            throw new common_1.UnauthorizedException('Conta desactivada');
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        const profile = await this.getUserProfile(user.id, user.role);
        return { user: { ...this.sanitizeUser(user), profile, googleName: `${given_name ?? ''} ${family_name ?? ''}`.trim() }, ...tokens };
    }
    async validateUser(email, password) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            return null;
        const valid = await bcrypt.compare(password, user.password);
        return valid ? user : null;
    }
    async generateTokens(userId, email, role) {
        const payload = { sub: userId, email, role };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwt.signAsync(payload, {
                secret: this.config.get('JWT_SECRET'),
                expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
            }),
            this.jwt.signAsync(payload, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
                expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
    async saveRefreshToken(userId, token) {
        const hashed = await bcrypt.hash(token, 10);
        await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: hashed } });
    }
    sanitizeUser(user) {
        const { password, refreshToken, ...safe } = user;
        return safe;
    }
    async getUserProfile(userId, role) {
        switch (role) {
            case 'ADMIN': return this.prisma.admin.findUnique({ where: { userId } });
            case 'INSTRUCTOR': return this.prisma.instructor.findUnique({ where: { userId } });
            case 'STUDENT': return this.prisma.student.findUnique({ where: { userId } });
            case 'PARENT': return this.prisma.parent.findUnique({ where: { userId } });
            default: return null;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map