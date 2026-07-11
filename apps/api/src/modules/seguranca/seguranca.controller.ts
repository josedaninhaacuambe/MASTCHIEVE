import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SegurancaService } from './seguranca.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('seguranca')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('seguranca')
export class SegurancaController {
  constructor(private svc: SegurancaService) {}

  @Get('semanal') @Roles('ADMIN', 'INSTRUCTOR', 'ADMIN') @ApiOperation({ summary: 'Dashboard semanal de segurança' })
  semanal(@Query('unidadeId') unidadeId?: string) { return this.svc.dashboardSemanal(unidadeId); }

  @Get('mensal') @Roles('ADMIN', 'ADMIN') @ApiOperation({ summary: 'Dashboard mensal de segurança com KPIs por dimensão' })
  mensal(@Query('unidadeId') unidadeId?: string) { return this.svc.dashboardMensal(unidadeId); }

  @Get('reincidencias') @Roles('ADMIN', 'ADMIN') @ApiOperation({ summary: 'Alertas de reincidência automática (3+ ocorrências/30 dias)' })
  reincidencias(@Query('unidadeId') unidadeId?: string) { return this.svc.reincidencias(unidadeId); }
}
