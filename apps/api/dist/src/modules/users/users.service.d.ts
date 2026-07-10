import { PrismaService } from '../../config/prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: any): Promise<{
        data: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            email: string;
            role: string;
            lastLoginAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    toggleActive(id: string): Promise<{
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
    changeRole(id: string, role: string): Promise<any>;
    getAuditLogs(query: any): Promise<{
        data: ({
            user: {
                id: string;
                email: string;
                role: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            action: string;
            entity: string;
            entityId: string | null;
            oldValues: string | null;
            newValues: string | null;
            ipAddress: string | null;
            userAgent: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getMe(userId: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        email: string;
        role: string;
        admin: {
            id: string;
            firstName: string;
            lastName: string;
        };
        instructor: {
            id: string;
            firstName: string;
            lastName: string;
            phone: string;
            specializations: string;
            bio: string;
        };
        student: {
            id: string;
            firstName: string;
            lastName: string;
            phone: string;
            dateOfBirth: Date;
            gender: string;
            medicalNotes: string;
        };
        parent: {
            id: string;
            firstName: string;
            lastName: string;
            phone: string;
        };
    }>;
    updateMe(userId: string, dto: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        bio?: string;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        email: string;
        role: string;
        admin: {
            id: string;
            firstName: string;
            lastName: string;
        };
        instructor: {
            id: string;
            firstName: string;
            lastName: string;
            phone: string;
            specializations: string;
            bio: string;
        };
        student: {
            id: string;
            firstName: string;
            lastName: string;
            phone: string;
            dateOfBirth: Date;
            gender: string;
            medicalNotes: string;
        };
        parent: {
            id: string;
            firstName: string;
            lastName: string;
            phone: string;
        };
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
        devToken?: undefined;
    } | {
        message: string;
        devToken: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
}
