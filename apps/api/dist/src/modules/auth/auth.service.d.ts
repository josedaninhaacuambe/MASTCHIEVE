import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma/prisma.service';
import { RegisterDto, RegisterVisitorDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private prisma;
    private jwt;
    private config;
    private email;
    private googleClient;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, email: EmailService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    refreshTokens(userId: string, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<void>;
    registerVisitor(dto: RegisterVisitorDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    googleAuth(credential: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    validateUser(email: string, password: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        email: string;
        password: string;
        role: string;
        lastLoginAt: Date | null;
        refreshToken: string | null;
        updatedAt: Date;
    }>;
    private generateTokens;
    private saveRefreshToken;
    private sanitizeUser;
    private getUserProfile;
}
