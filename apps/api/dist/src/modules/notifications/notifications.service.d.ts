import { PrismaService } from '../../config/prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    createForUser(userId: string, type: any, title: string, body: string, data?: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        data: string | null;
        title: string;
        type: string;
        body: string;
        readAt: Date | null;
    }>;
    createForRole(role: string, type: any, title: string, body: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getUserNotifications(userId: string, page?: number, limit?: number): Promise<{
        data: {
            id: string;
            createdAt: Date;
            userId: string;
            data: string | null;
            title: string;
            type: string;
            body: string;
            readAt: Date | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            unread: number;
        };
    }>;
    markAllRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markRead(id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        data: string | null;
        title: string;
        type: string;
        body: string;
        readAt: Date | null;
    }>;
    sendBulk(dto: {
        title: string;
        body: string;
        type: string;
        target: string;
    }, gateway: any): Promise<{
        sent: number;
        total: number;
    }>;
}
