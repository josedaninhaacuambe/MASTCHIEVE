import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AvaliacoesService } from './avaliacoes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegistrarAvaliacaoDto } from './dto/registrar-avaliacao.dto';

@ApiTags('avaliacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('avaliacoes')
export class AvaliacoesController {
  constructor(private service: AvaliacoesService) {}

  @Get('modulo-ativo/:studentId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Obter módulo ativo e critérios de avaliação do aluno' })
  getModuloAtivo(@Param('studentId') studentId: string) {
    return this.service.getModuloAtivo(studentId);
  }

  @Post()
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Registar avaliação diária' })
  registrar(@Body() dto: RegistrarAvaliacaoDto, @CurrentUser() user: { id: string; role: string }) {
    if (dto.tipo === 'AGENDADA') {
      throw new BadRequestException(
        'Avaliações agendadas devem ser submetidas via POST /avaliacoes-agendadas/:id/estudante/:studentId',
      );
    }
    return this.service.registrarAvaliacao(dto, user);
  }

  @Get('me')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Histórico de avaliações do atleta autenticado' })
  findMine(@CurrentUser('id') userId: string, @Query('tipo') tipo?: string) {
    return this.service.findMineAsStudent(userId, tipo);
  }

  @Get('sessao/:classSessionId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Alunos já avaliados numa sessão de aula específica' })
  getAvaliadosNaSessao(@Param('classSessionId') classSessionId: string) {
    return this.service.getAvaliadosNaSessao(classSessionId);
  }
}
