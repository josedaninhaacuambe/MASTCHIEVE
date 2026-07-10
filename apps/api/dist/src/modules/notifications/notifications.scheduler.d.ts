import { PrismaService } from '../../config/prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
export declare class NotificationsScheduler {
    private prisma;
    private notifService;
    private gateway;
    private readonly logger;
    constructor(prisma: PrismaService, notifService: NotificationsService, gateway: NotificationsGateway);
    checkPaymentsDue(): Promise<void>;
    checkAttendance(): Promise<void>;
    notifyFeedbackSent(studentUserId: string, feedbackId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        data: string | null;
        title: string;
        type: string;
        body: string;
        readAt: Date | null;
    }>;
    notifyPerformanceRecorded(studentUserId: string, overallScore: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        data: string | null;
        title: string;
        type: string;
        body: string;
        readAt: Date | null;
    }>;
}
