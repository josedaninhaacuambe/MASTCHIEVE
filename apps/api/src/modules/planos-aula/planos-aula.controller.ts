import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlanosAulaService } from './planos-aula.service';
import { GuardarPlanoAulaDto } from './dto/plano-aula.dto';

@ApiTags('planos-aula')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'INSTRUCTOR')
@Controller('planos-aula')
export class PlanosAulaController {
  constructor(private service: PlanosAulaService) {}

  @Get('turmas')
  @ApiOperation({ summary: 'Turmas para as quais o utilizador pode fazer plano de aula' })
  turmas(@CurrentUser() user: any) {
    return this.service.turmas({ id: user.id, role: user.role });
  }

  @Get()
  @ApiOperation({ summary: 'Listar planos de aula (filtros: classId, semana=AAAA-MM-DD)' })
  listar(@CurrentUser() user: any, @Query('classId') classId?: string, @Query('semana') semana?: string) {
    return this.service.listar({ id: user.id, role: user.role }, { classId, semana });
  }

  @Get(':id')
  obter(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.obter({ id: user.id, role: user.role }, id);
  }

  @Put()
  @ApiOperation({ summary: 'Criar ou actualizar o plano de aula da turma para a semana' })
  guardar(@CurrentUser() user: any, @Body() dto: GuardarPlanoAulaDto) {
    return this.service.guardar({ id: user.id, role: user.role }, dto);
  }

  @Delete(':id')
  remover(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remover({ id: user.id, role: user.role }, id);
  }
}
