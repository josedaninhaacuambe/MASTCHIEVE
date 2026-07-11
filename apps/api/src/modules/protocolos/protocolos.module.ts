import { Module } from '@nestjs/common';
import { ProtocolosController } from './protocolos.controller';
import { ProtocolosService } from './protocolos.service';

@Module({ controllers: [ProtocolosController], providers: [ProtocolosService] })
export class ProtocolosModule {}
