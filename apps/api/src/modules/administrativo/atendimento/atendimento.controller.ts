import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AtendimentoService } from './atendimento.service';
import { CreateAtendimentoDto } from './dto/create-atendimento.dto';
import { ResolverAtendimentoDto } from './dto/resolver-atendimento.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('atendimento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('atendimento')
export class AtendimentoController {
  constructor(private service: AtendimentoService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar atendimentos de receção' })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Obter atendimento por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Registar novo atendimento de receção' })
  create(@Body() dto: CreateAtendimentoDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Put(':id/resolver')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Registar desfecho e resolver atendimento' })
  resolver(@Param('id') id: string, @Body() dto: ResolverAtendimentoDto, @CurrentUser('id') userId: string) {
    return this.service.resolver(id, dto.desfecho, userId);
  }
}
