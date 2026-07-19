import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContratosService } from './contratos.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('rh-contratos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh/contratos')
export class ContratosController {
  constructor(private contratosService: ContratosService) {}

  @Get()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar contratos' })
  findAll(@Query() query: any) {
    return this.contratosService.findAll(query);
  }

  @Get(':id')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Obter contrato por ID' })
  findOne(@Param('id') id: string) {
    return this.contratosService.findOne(id);
  }

  @Post()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Elaborar contrato (rascunho aguarda assinatura)' })
  create(@Body() dto: CreateContratoDto, @CurrentUser('id') userId: string) {
    return this.contratosService.create(dto, userId);
  }

  @Put(':id/assinar')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Assinar contrato — ativa o funcionário' })
  assinar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.contratosService.assinar(id, userId);
  }

  @Put(':id/rescindir')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Rescindir contrato' })
  rescindir(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.contratosService.rescindir(id, userId);
  }
}
