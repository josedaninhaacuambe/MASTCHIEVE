import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({ imports: [WhatsappModule], controllers: [LeadsController], providers: [LeadsService], exports: [LeadsService] })
export class LeadsModule {}
