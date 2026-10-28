import { Module } from '@nestjs/common';
import { EventosController } from './eventos.controller';
import { EventosPublicoController } from './eventos-publico.controller';
import { EventosService } from './eventos.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({ imports: [WhatsappModule], controllers: [EventosController, EventosPublicoController], providers: [EventosService] })
export class EventosModule {}
