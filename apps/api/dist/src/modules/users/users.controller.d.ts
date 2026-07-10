import { UsersService } from './users.service';
declare class UpdateMeDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    bio?: string;
}
declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
declare class ForgotPasswordDto {
    email: string;
}
declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
export declare class UsersController {
    private service;
    constructor(service: UsersService);
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
    updateMe(userId: string, dto: UpdateMeDto): Promise<{
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
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
        devToken?: undefined;
    } | {
        message: string;
        devToken: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
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
    toggle(id: string): Promise<{
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
}
export {};
