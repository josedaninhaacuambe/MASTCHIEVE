import { Module } from '@nestjs/common';
import { FasesModule } from '../fases/fases.module';
import { AvaliacoesIniciaisController } from './avaliacoes-iniciais.controller';
import { AvaliacoesIniciaisService } from './avaliacoes-iniciais.service';

@Module({ imports: [FasesModule], controllers: [AvaliacoesIniciaisController], providers: [AvaliacoesIniciaisService] })
export class AvaliacoesIniciaisModule {}
