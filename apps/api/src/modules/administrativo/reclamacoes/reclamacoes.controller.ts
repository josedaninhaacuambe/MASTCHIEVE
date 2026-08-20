import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReclamacoesService } from './reclamacoes.service';
import { CreateReclamacaoDto } from './dto/create-reclamacao.dto';
import { ResponderReclamacaoDto } from './dto/responder-reclamacao.dto';
import { UpdateEstadoReclamacaoDto } from './dto/update-estado-reclamacao.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('reclamacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reclamacoes')
export class ReclamacoesController {
  constructor(private service: ReclamacoesService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN', 'PARENT')
  @ApiOperation({ summary: 'Listar reclamações, sugestões e elogios' })
  findAll(@Query() query: any, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.service.findAll(query, userId, role);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Obter reclamação por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN', 'PARENT')
  @ApiOperation({ summary: 'Registar reclamação, sugestão ou elogio' })
  create(@Body() dto: CreateReclamacaoDto, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.service.create(dto, userId, role);
  }

  @Put(':id/responder')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Registar resposta e marcar como respondida' })
  responder(@Param('id') id: string, @Body() dto: ResponderReclamacaoDto, @CurrentUser('id') userId: string) {
    return this.service.responder(id, dto.resposta, userId);
  }

  @Put(':id/estado')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Alterar estado da reclamação' })
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoReclamacaoDto, @CurrentUser('id') userId: string) {
    return this.service.updateEstado(id, dto.estado, userId);
  }
}
