import { Module } from '@nestjs/common';
import { AvaliacoesIniciaisController } from './avaliacoes-iniciais.controller';
import { AvaliacoesIniciaisService } from './avaliacoes-iniciais.service';

@Module({ controllers: [AvaliacoesIniciaisController], providers: [AvaliacoesIniciaisService] })
export class AvaliacoesIniciaisModule {}
