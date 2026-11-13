import { Module } from '@nestjs/common';
import { PlanosAulaController } from './planos-aula.controller';
import { PlanosAulaService } from './planos-aula.service';

@Module({ controllers: [PlanosAulaController], providers: [PlanosAulaService] })
export class PlanosAulaModule {}
