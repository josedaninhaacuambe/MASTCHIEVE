import { Module } from '@nestjs/common';
import { AuditModule } from './common/audit/audit.module';
import { SwimmingModulesModule } from './modules/swimming-modules/swimming-modules.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './config/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { InstructorsModule } from './modules/instructors/instructors.module';
import { ClassesModule } from './modules/classes/classes.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { FinancialModule } from './modules/financial/financial.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { KpiModule } from './modules/kpi/kpi.module';
import { AiModule } from './modules/ai/ai.module';
import { EmailModule } from './modules/email/email.module';
import { ParentsModule } from './modules/parents/parents.module';
import { TrainingPlansModule } from './modules/training-plans/training-plans.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Suporta URL Upstash (rediss://...) ou Redis local (host/port)
        const redisUrl = configService.get<string>('REDIS_URL');
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        const redis: any = redisUrl
          ? redisUrl  // Upstash ou outro Redis cloud via URL
          : {
              host: configService.get('REDIS_HOST', 'localhost'),
              port: configService.get<number>('REDIS_PORT', 6379),
              ...(redisPassword && { password: redisPassword }),
            };
        return {
          redis,
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 200,
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
          },
        };
      },
      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    InstructorsModule,
    ClassesModule,
    AttendanceModule,
    FeedbackModule,
    FinancialModule,
    NotificationsModule,
    KpiModule,
    AiModule,
    SwimmingModulesModule,
    DocumentsModule,
    EmailModule,
    ParentsModule,
    TrainingPlansModule,
  ],
})
export class AppModule {}
