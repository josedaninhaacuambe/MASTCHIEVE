import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VagasService } from './vagas.service';
import { CreateVagaDto } from './dto/create-vaga.dto';
import { RejeitarDto } from './dto/rejeitar.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('rh-vagas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh/vagas')
export class VagasController {
  constructor(private vagasService: VagasService) {}

  @Get()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar vagas' })
  findAll(@Query() query: any) {
    return this.vagasService.findAll(query);
  }

  @Get(':id')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Obter vaga por ID' })
  findOne(@Param('id') id: string) {
    return this.vagasService.findOne(id);
  }

  @Post()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Solicitar abertura de vaga' })
  create(@Body() dto: CreateVagaDto, @CurrentUser('id') userId: string) {
    return this.vagasService.create(dto, userId);
  }

  @Put(':id/aprovar')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Aprovar orçamento/abertura de vaga' })
  aprovar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.vagasService.aprovar(id, userId);
  }

  @Put(':id/rejeitar')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Rejeitar vaga' })
  rejeitar(@Param('id') id: string, @Body() dto: RejeitarDto, @CurrentUser('id') userId: string) {
    return this.vagasService.rejeitar(id, dto, userId);
  }

  @Put(':id/publicar')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Publicar vaga aprovada' })
  publicar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.vagasService.publicar(id, userId);
  }

  @Put(':id/encerrar')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Encerrar vaga' })
  encerrar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.vagasService.encerrar(id, userId);
  }
}
