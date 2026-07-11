import { Module } from '@nestjs/common';
import { SegurancaController } from './seguranca.controller';
import { SegurancaService } from './seguranca.service';

@Module({ controllers: [SegurancaController], providers: [SegurancaService] })
export class SegurancaModule {}
