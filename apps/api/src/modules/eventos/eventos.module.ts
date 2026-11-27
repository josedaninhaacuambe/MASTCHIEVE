import { Module } from '@nestjs/common';
import { EventosController } from './eventos.controller';
import { EventosPublicoController } from './eventos-publico.controller';
import { EventosService } from './eventos.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StudentsModule } from '../students/students.module';
import { FinancialModule } from '../financial/financial.module';
import { EventosMatriculaController } from './eventos-matricula.controller';
import { EventosMatriculaService } from './eventos-matricula.service';

@Module({
  imports: [WhatsappModule, NotificationsModule, StudentsModule, FinancialModule],
  controllers: [EventosController, EventosMatriculaController, EventosPublicoController],
  providers: [EventosService, EventosMatriculaService],
})
export class EventosModule {}
