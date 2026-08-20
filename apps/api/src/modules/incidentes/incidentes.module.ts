import { Module } from '@nestjs/common';
import { IncidentesController } from './incidentes.controller';
import { IncidentesService } from './incidentes.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({ imports: [NotificationsModule], controllers: [IncidentesController], providers: [IncidentesService] })
export class IncidentesModule {}
