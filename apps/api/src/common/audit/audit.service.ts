import { Injectable } from '@nestjs/common';
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

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: AuditParams) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          oldValues: params.oldValues ? JSON.stringify(params.oldValues) : undefined,
          newValues: params.newValues ? JSON.stringify(params.newValues) : undefined,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch {
      // Audit failure must never break the main flow
    }
  }
}
