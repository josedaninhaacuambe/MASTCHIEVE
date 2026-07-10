import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
export declare class NotificationsController {
    private service;
    private gateway;
    constructor(service: NotificationsService, gateway: NotificationsGateway);
    getMyNotifications(userId: string, q: any): Promise<{
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
    sendBulk(body: {
        title: string;
        body: string;
        type: string;
        target: string;
    }): Promise<{
        sent: number;
        total: number;
    }>;
}
