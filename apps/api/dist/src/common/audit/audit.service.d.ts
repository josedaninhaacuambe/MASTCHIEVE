import { PrismaService } from '../../config/prisma/prisma.service';
interface AuditParams {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(params: AuditParams): Promise<void>;
}
export {};
