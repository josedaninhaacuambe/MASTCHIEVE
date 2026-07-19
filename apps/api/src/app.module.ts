import { Module } from '@nestjs/common';
import { AuditModule } from './common/audit/audit.module';
import { SwimmingModulesModule } from './modules/swimming-modules/swimming-modules.module';
import { UnidadesModule } from './modules/unidades/unidades.module';
import { LeadsModule } from './modules/leads/leads.module';
import { IncidentesModule } from './modules/incidentes/incidentes.module';
import { FasesModule } from './modules/fases/fases.module';
import { CertificadosModule } from './modules/certificados/certificados.module';
import { AvaliacoesIniciaisModule } from './modules/avaliacoes-iniciais/avaliacoes-iniciais.module';
import { EventosModule } from './modules/eventos/eventos.module';
import { CompeticoesModule } from './modules/competicoes/competicoes.module';
import { ComunicacaoModule } from './modules/comunicacao/comunicacao.module';
import { ProtocolosModule } from './modules/protocolos/protocolos.module';
import { SegurancaModule } from './modules/seguranca/seguranca.module';
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
import { RecursosHumanosModule } from './modules/recursos-humanos/recursos-humanos.module';

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
    UnidadesModule,
    LeadsModule,
    IncidentesModule,
    FasesModule,
    CertificadosModule,
    AvaliacoesIniciaisModule,
    EventosModule,
    CompeticoesModule,
    ComunicacaoModule,
    ProtocolosModule,
    SegurancaModule,
    RecursosHumanosModule,
  ],
})
export class AppModule {}
