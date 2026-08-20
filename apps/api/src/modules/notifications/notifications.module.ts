import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsScheduler } from './notifications.scheduler';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [ConfigModule, WhatsappModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, NotificationsScheduler],
  exports: [NotificationsService, NotificationsGateway, NotificationsScheduler],
})
export class NotificationsModule {}
