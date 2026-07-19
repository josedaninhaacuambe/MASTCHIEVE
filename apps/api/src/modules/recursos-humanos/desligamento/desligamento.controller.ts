import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DesligamentoService } from './desligamento.service';
import { CreateDesligamentoDto } from './dto/create-desligamento.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('rh-desligamento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh/desligamento')
export class DesligamentoController {
  constructor(private service: DesligamentoService) {}

  @Get()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar processos de desligamento' })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Obter processo de desligamento por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Iniciar processo de desligamento' })
  create(@Body() dto: CreateDesligamentoDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Put(':id/aprovar')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Aprovar desligamento — desativa acessos e cancela escalas futuras' })
  aprovar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.aprovar(id, userId);
  }

  @Put(':id/rejeitar')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Rejeitar processo de desligamento' })
  rejeitar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.rejeitar(id, userId);
  }
}
