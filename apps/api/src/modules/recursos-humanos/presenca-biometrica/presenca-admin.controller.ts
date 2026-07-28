import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PresencaAdminService } from './presenca-admin.service';
import { LancamentoManualDto } from './dto/lancamento-manual.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('rh-presenca-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_RH', 'SUPER_ADMIN')
@Controller('rh/presenca/registos')
export class PresencaAdminController {
  constructor(private presencaAdminService: PresencaAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Listar registos de presença biométrica (com filtros)' })
  findAll(@Query() query: any) {
    return this.presencaAdminService.findAll(query);
  }

  @Post('manual')
  @ApiOperation({ summary: 'Lançar registo de presença manualmente (quando a biometria falha)' })
  lancarManual(@Body() dto: LancamentoManualDto, @CurrentUser('id') userId: string) {
    return this.presencaAdminService.lancarManual(dto, userId);
  }
}
