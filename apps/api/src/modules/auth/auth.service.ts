import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { RegisterDto, RegisterVisitorDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {
    this.googleClient = new OAuth2Client(this.config.get('GOOGLE_CLIENT_ID'));
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email já registado');

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
    this.email.sendWelcome(dto.email, dto.firstName, dto.role).catch(() => {});
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const profile = await this.getUserProfile(user.id, user.role);
    return { user: { ...this.sanitizeUser(user), profile }, ...tokens };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.refreshToken) throw new UnauthorizedException();

    const matches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!matches) throw new UnauthorizedException('Refresh token inválido');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async registerVisitor(dto: RegisterVisitorDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email já registado');

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

  async googleAuth(credential: string) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    if (!clientId) throw new BadRequestException('Google OAuth não configurado');

    let payload: any;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Token Google inválido');
    }

    const { email, given_name, family_name, sub: googleId } = payload;
    if (!email) throw new BadRequestException('Email não disponível na conta Google');

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

    if (!user.isActive) throw new UnauthorizedException('Conta desactivada');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const profile = await this.getUserProfile(user.id, user.role);
    return { user: { ...this.sanitizeUser(user), profile, googleName: `${given_name ?? ''} ${family_name ?? ''}`.trim() }, ...tokens };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password);
    return valid ? user : null;
  }

  private async generateTokens(userId: string, email: string, role: string) {
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

  private async saveRefreshToken(userId: string, token: string) {
    const hashed = await bcrypt.hash(token, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: hashed } });
  }

  private sanitizeUser(user: any) {
    const { password, refreshToken, ...safe } = user;
    return safe;
  }

  private async getUserProfile(userId: string, role: string) {
    switch (role) {
      case 'ADMIN': return this.prisma.admin.findUnique({ where: { userId } });
      case 'INSTRUCTOR': return this.prisma.instructor.findUnique({ where: { userId } });
      case 'STUDENT': return this.prisma.student.findUnique({ where: { userId } });
      case 'PARENT': return this.prisma.parent.findUnique({ where: { userId } });
      default: return null;
    }
  }
}
