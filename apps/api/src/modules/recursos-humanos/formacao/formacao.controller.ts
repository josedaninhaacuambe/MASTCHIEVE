import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FormacaoService } from './formacao.service';
import { CreateFormacaoDto } from './dto/create-formacao.dto';
import { InscreverFormacaoDto, ActualizarInscricaoDto, CancelarInscricaoDto, DefinirVagasDto } from './dto/inscrever-formacao.dto';
import { ConcluirFormacaoDto } from './dto/concluir-formacao.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles, AppRole } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

// Quem gere inscrições (registar, consultar, corrigir, cancelar, ver vagas e histórico).
// Propor formações continua com RH; aprovar/rejeitar orçamento continua só com o Super Admin.
const GESTAO_INSCRICOES: AppRole[] = ['ADMIN', 'ASSISTENTE_ADMIN', 'GESTOR_RH', 'SUPER_ADMIN'];

@ApiTags('rh-formacao')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh/formacao')
export class FormacaoController {
  constructor(private service: FormacaoService) {}

  @Get()
  @Roles(...GESTAO_INSCRICOES)
  @ApiOperation({ summary: 'Listar formações' })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get('inscricoes/funcionario/:funcionarioId')
  @Roles(...GESTAO_INSCRICOES)
  @ApiOperation({ summary: 'Formações em que um colaborador está ou esteve inscrito' })
  inscricoesDoFuncionario(@Param('funcionarioId', ParseUUIDPipe) funcionarioId: string) {
    return this.service.inscricoesDoFuncionario(funcionarioId);
  }

  @Get(':id/inscricoes')
  @Roles(...GESTAO_INSCRICOES)
  @ApiOperation({ summary: 'Lista de inscritos e resumo de vagas' })
  listarInscricoes(@Param('id', ParseUUIDPipe) id: string, @Query() query: any) {
    return this.service.listarInscricoes(id, query);
  }

  @Get(':id/historico')
  @Roles(...GESTAO_INSCRICOES)
  @ApiOperation({ summary: 'Histórico (auditoria) da formação e das inscrições' })
  historico(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.historico(id);
  }

  @Get(':id')
  @Roles(...GESTAO_INSCRICOES)
  @ApiOperation({ summary: 'Obter formação por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
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

  @Put(':id/vagas')
  @Roles(...GESTAO_INSCRICOES)
  @ApiOperation({ summary: 'Definir a capacidade (vagas) da formação' })
  definirVagas(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DefinirVagasDto, @CurrentUser('id') userId: string) {
    return this.service.definirVagas(id, dto.vagas, userId);
  }

  @Post(':id/inscrever')
  @Roles(...GESTAO_INSCRICOES)
  @ApiOperation({ summary: 'Inscrever colaborador numa formação (sem duplicados, respeita vagas)' })
  inscrever(@Param('id', ParseUUIDPipe) id: string, @Body() dto: InscreverFormacaoDto, @CurrentUser('id') userId: string) {
    return this.service.inscrever(id, dto, userId);
  }

  @Put('inscricoes/:inscricaoId')
  @Roles(...GESTAO_INSCRICOES)
  @ApiOperation({ summary: 'Corrigir uma inscrição (observações / desistência)' })
  actualizarInscricao(
    @Param('inscricaoId', ParseUUIDPipe) inscricaoId: string,
    @Body() dto: ActualizarInscricaoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.actualizarInscricao(inscricaoId, dto, userId);
  }

  @Put('inscricoes/:inscricaoId/cancelar')
  @Roles(...GESTAO_INSCRICOES)
  @ApiOperation({ summary: 'Cancelar uma inscrição (com motivo)' })
  cancelarInscricao(
    @Param('inscricaoId', ParseUUIDPipe) inscricaoId: string,
    @Body() dto: CancelarInscricaoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.cancelarInscricao(inscricaoId, dto.motivo, userId);
  }

  @Put('inscricoes/:inscricaoId/reactivar')
  @Roles(...GESTAO_INSCRICOES)
  @ApiOperation({ summary: 'Reactivar uma inscrição cancelada ou desistida' })
  reactivarInscricao(@Param('inscricaoId', ParseUUIDPipe) inscricaoId: string, @CurrentUser('id') userId: string) {
    return this.service.reactivarInscricao(inscricaoId, userId);
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
