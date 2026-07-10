import { Module } from '@nestjs/common';
import { FasesController } from './fases.controller';
import { FasesService } from './fases.service';

@Module({ controllers: [FasesController], providers: [FasesService], exports: [FasesService] })
export class FasesModule {}
