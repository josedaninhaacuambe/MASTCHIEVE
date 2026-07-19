import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EscalasService } from './escalas.service';
import { CreateEscalaDto } from './dto/create-escala.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('rh-escalas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh/escalas')
export class EscalasController {
  constructor(private escalasService: EscalasService) {}

  @Get()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar escalas' })
  findAll(@Query() query: any) {
    return this.escalasService.findAll(query);
  }

  @Get(':id')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Obter escala por ID' })
  findOne(@Param('id') id: string) {
    return this.escalasService.findOne(id);
  }

  @Post()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Criar entrada de escala' })
  create(@Body() dto: CreateEscalaDto, @CurrentUser('id') userId: string) {
    return this.escalasService.create(dto, userId);
  }

  @Put(':id/confirmar')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Confirmar escala' })
  confirmar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.escalasService.confirmar(id, userId);
  }

  @Put(':id/cancelar')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Cancelar escala' })
  cancelar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.escalasService.cancelar(id, userId);
  }
}
