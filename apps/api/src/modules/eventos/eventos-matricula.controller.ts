import { Body, Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { MatricularUnidadeDto } from './dto/eventos.dto';
import { EventosMatriculaService } from './eventos-matricula.service';

@ApiTags('eventos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('eventos')
export class EventosMatriculaController {
  constructor(private readonly svc: EventosMatriculaService) {}

  /** Mesmos perfis que criam atletas e registam pagamentos. */
  @Post(':id/matricular-unidade')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Inscrever participantes do evento como atletas de uma unidade (após acordo e pagamento)' })
  matricular(@Param('id') id: string, @Body() dto: MatricularUnidadeDto, @Request() req: any) {
    return this.svc.matricular(id, dto, { id: req.user.id, role: req.user.role });
  }
}
