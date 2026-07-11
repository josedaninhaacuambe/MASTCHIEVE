"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_1 = require("./common/audit/audit.module");
const swimming_modules_module_1 = require("./modules/swimming-modules/swimming-modules.module");
const unidades_module_1 = require("./modules/unidades/unidades.module");
const leads_module_1 = require("./modules/leads/leads.module");
const incidentes_module_1 = require("./modules/incidentes/incidentes.module");
const fases_module_1 = require("./modules/fases/fases.module");
const certificados_module_1 = require("./modules/certificados/certificados.module");
const avaliacoes_iniciais_module_1 = require("./modules/avaliacoes-iniciais/avaliacoes-iniciais.module");
const eventos_module_1 = require("./modules/eventos/eventos.module");
const competicoes_module_1 = require("./modules/competicoes/competicoes.module");
const comunicacao_module_1 = require("./modules/comunicacao/comunicacao.module");
const protocolos_module_1 = require("./modules/protocolos/protocolos.module");
const seguranca_module_1 = require("./modules/seguranca/seguranca.module");
const documents_module_1 = require("./modules/documents/documents.module");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const bull_1 = require("@nestjs/bull");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./config/prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const students_module_1 = require("./modules/students/students.module");
const instructors_module_1 = require("./modules/instructors/instructors.module");
const classes_module_1 = require("./modules/classes/classes.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const feedback_module_1 = require("./modules/feedback/feedback.module");
const financial_module_1 = require("./modules/financial/financial.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const kpi_module_1 = require("./modules/kpi/kpi.module");
const ai_module_1 = require("./modules/ai/ai.module");
const email_module_1 = require("./modules/email/email.module");
const parents_module_1 = require("./modules/parents/parents.module");
const training_plans_module_1 = require("./modules/training-plans/training-plans.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
            }),
            throttler_1.ThrottlerModule.forRoot([
                { name: 'short', ttl: 1000, limit: 10 },
                { name: 'medium', ttl: 10000, limit: 50 },
                { name: 'long', ttl: 60000, limit: 200 },
            ]),
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const redisUrl = configService.get('REDIS_URL');
                    const redisPassword = configService.get('REDIS_PASSWORD');
                    const redis = redisUrl
                        ? redisUrl
                        : {
                            host: configService.get('REDIS_HOST', 'localhost'),
                            port: configService.get('REDIS_PORT', 6379),
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
                inject: [config_1.ConfigService],
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            students_module_1.StudentsModule,
            instructors_module_1.InstructorsModule,
            classes_module_1.ClassesModule,
            attendance_module_1.AttendanceModule,
            feedback_module_1.FeedbackModule,
            financial_module_1.FinancialModule,
            notifications_module_1.NotificationsModule,
            kpi_module_1.KpiModule,
            ai_module_1.AiModule,
            swimming_modules_module_1.SwimmingModulesModule,
            documents_module_1.DocumentsModule,
            email_module_1.EmailModule,
            parents_module_1.ParentsModule,
            training_plans_module_1.TrainingPlansModule,
            unidades_module_1.UnidadesModule,
            leads_module_1.LeadsModule,
            incidentes_module_1.IncidentesModule,
            fases_module_1.FasesModule,
            certificados_module_1.CertificadosModule,
            avaliacoes_iniciais_module_1.AvaliacoesIniciaisModule,
            eventos_module_1.EventosModule,
            competicoes_module_1.CompeticoesModule,
            comunicacao_module_1.ComunicacaoModule,
            protocolos_module_1.ProtocolosModule,
            seguranca_module_1.SegurancaModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map