import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AvaliacoesAgendadasService } from './avaliacoes-agendadas.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateAvaliacaoAgendadaDto } from './dto/create-avaliacao-agendada.dto';
import { SubmitResultadoDto } from './dto/submit-resultado.dto';

@ApiTags('avaliacoes-agendadas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('avaliacoes-agendadas')
export class AvaliacoesAgendadasController {
  constructor(private service: AvaliacoesAgendadasService) {}

  @Get('me')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Histórico de avaliações agendadas do atleta autenticado' })
  findMine(@CurrentUser('id') userId: string) {
    return this.service.findMineAsStudent(userId);
  }

  @Get()
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Listar sessões de avaliação agendadas' })
  findAll(@CurrentUser() user: { id: string; role: string }) {
    return this.service.findAll(user);
  }

  @Post()
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Agendar sessão de avaliação formal para uma turma' })
  create(@Body() dto: CreateAvaliacaoAgendadaDto, @CurrentUser() user: { id: string; role: string }) {
    return this.service.create(dto, user);
  }

  @Get(':id/roster')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Obter roster de avaliação da sessão' })
  getRoster(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.service.getRoster(id, user);
  }

  @Post(':id/estudante/:studentId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Registar resultado de avaliação formal de um atleta' })
  submitResultado(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Body() dto: SubmitResultadoDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.service.submitResultado(id, studentId, dto, user);
  }
}
