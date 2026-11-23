import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { RelatorioDiarioService } from './relatorio-diario.service';

@Module({ controllers: [AttendanceController], providers: [AttendanceService, RelatorioDiarioService], exports: [AttendanceService] })
export class AttendanceModule {}
