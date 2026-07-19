import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RelatoriosRhService } from './relatorios-rh.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('rh-relatorios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh/relatorios')
export class RelatoriosRhController {
  constructor(private service: RelatoriosRhService) {}

  @Get('dashboard')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Painel resumo do módulo de RH' })
  dashboard() {
    return this.service.dashboard();
  }

  @Get('auditoria')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Histórico de auditoria de ações de RH' })
  auditoria(@Query() query: any) {
    return this.service.auditoria(query);
  }
}
