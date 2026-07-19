import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AvaliacoesDesempenhoService } from './avaliacoes-desempenho.service';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { RealizarAvaliacaoDto } from './dto/realizar-avaliacao.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('rh-avaliacoes-desempenho')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh/avaliacoes-desempenho')
export class AvaliacoesDesempenhoController {
  constructor(private service: AvaliacoesDesempenhoService) {}

  @Get()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar avaliações de desempenho' })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Obter avaliação por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Agendar avaliação de desempenho' })
  create(@Body() dto: CreateAvaliacaoDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Put(':id/realizar')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Registar resultado da avaliação de desempenho' })
  realizar(@Param('id') id: string, @Body() dto: RealizarAvaliacaoDto, @CurrentUser('id') userId: string) {
    return this.service.realizar(id, dto, userId);
  }
}
