import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CandidaturasService } from './candidaturas.service';
import { CreateCandidaturaDto } from './dto/create-candidatura.dto';
import { AvaliarCandidaturaDto } from './dto/avaliar-candidatura.dto';
import { AprovarFinalCandidaturaDto } from './dto/aprovar-final-candidatura.dto';
import { RejeitarDto } from './dto/rejeitar.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('rh-candidaturas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh/candidaturas')
export class CandidaturasController {
  constructor(private candidaturasService: CandidaturasService) {}

  @Get()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar candidaturas' })
  findAll(@Query() query: any) {
    return this.candidaturasService.findAll(query);
  }

  @Get(':id')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Obter candidatura por ID' })
  findOne(@Param('id') id: string) {
    return this.candidaturasService.findOne(id);
  }

  @Post()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Registar candidatura a uma vaga' })
  create(@Body() dto: CreateCandidaturaDto) {
    return this.candidaturasService.create(dto);
  }

  @Put(':id/avaliar')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Registar avaliação de entrevista/teste prático' })
  avaliar(@Param('id') id: string, @Body() dto: AvaliarCandidaturaDto, @CurrentUser('id') userId: string) {
    return this.candidaturasService.avaliar(id, dto, userId);
  }

  @Put(':id/rejeitar')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Rejeitar candidatura' })
  rejeitar(@Param('id') id: string, @Body() dto: RejeitarDto, @CurrentUser('id') userId: string) {
    return this.candidaturasService.rejeitar(id, dto, userId);
  }

  @Put(':id/aprovar-final')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Aprovar contratação final — cria Funcionário e Contrato rascunho' })
  aprovarFinal(@Param('id') id: string, @Body() dto: AprovarFinalCandidaturaDto, @CurrentUser('id') userId: string) {
    return this.candidaturasService.aprovarFinal(id, dto, userId);
  }
}
