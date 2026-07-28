import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DispositivosService } from './dispositivos.service';
import { CreateDispositivoDto } from './dto/create-dispositivo.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('rh-presenca-dispositivos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_RH', 'SUPER_ADMIN')
@Controller('rh/presenca/dispositivos')
export class DispositivosController {
  constructor(private dispositivosService: DispositivosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar quiosques de presença' })
  findAll(@Query() query: any) {
    return this.dispositivosService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter quiosque por ID' })
  findOne(@Param('id') id: string) {
    return this.dispositivosService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar quiosque (devolve a chave em claro apenas nesta resposta)' })
  create(@Body() dto: CreateDispositivoDto, @CurrentUser('id') userId: string) {
    return this.dispositivosService.create(dto, userId);
  }

  @Put(':id/ativar')
  @ApiOperation({ summary: 'Ativar quiosque' })
  ativar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.dispositivosService.toggleAtivo(id, true, userId);
  }

  @Put(':id/desativar')
  @ApiOperation({ summary: 'Desativar quiosque' })
  desativar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.dispositivosService.toggleAtivo(id, false, userId);
  }

  @Put(':id/rotar-chave')
  @ApiOperation({ summary: 'Rotacionar chave do quiosque (devolve a nova chave em claro apenas nesta resposta)' })
  rotarChave(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.dispositivosService.rotateKey(id, userId);
  }
}
