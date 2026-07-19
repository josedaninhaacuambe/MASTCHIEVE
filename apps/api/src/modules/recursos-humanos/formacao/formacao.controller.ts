import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FormacaoService } from './formacao.service';
import { CreateFormacaoDto } from './dto/create-formacao.dto';
import { InscreverFormacaoDto } from './dto/inscrever-formacao.dto';
import { ConcluirFormacaoDto } from './dto/concluir-formacao.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('rh-formacao')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh/formacao')
export class FormacaoController {
  constructor(private service: FormacaoService) {}

  @Get()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar formações' })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Obter formação por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Propor formação' })
  create(@Body() dto: CreateFormacaoDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Put(':id/aprovar-orcamento')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Aprovar orçamento da formação' })
  aprovarOrcamento(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.aprovarOrcamento(id, userId);
  }

  @Put(':id/rejeitar')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Rejeitar formação' })
  rejeitar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.rejeitar(id, userId);
  }

  @Post(':id/inscrever')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Inscrever funcionário numa formação' })
  inscrever(@Param('id') id: string, @Body() dto: InscreverFormacaoDto, @CurrentUser('id') userId: string) {
    return this.service.inscrever(id, dto, userId);
  }

  @Put('participantes/:participanteId/concluir')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Registar conclusão de formação do participante' })
  concluirParticipante(
    @Param('participanteId') participanteId: string,
    @Body() dto: ConcluirFormacaoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.concluirParticipante(participanteId, dto, userId);
  }
}
