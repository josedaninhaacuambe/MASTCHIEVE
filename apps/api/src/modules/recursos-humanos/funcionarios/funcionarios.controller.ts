import { Controller, Get, Post, Put, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { FuncionariosService } from './funcionarios.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { FuncionarioQueryDto } from './dto/funcionario-query.dto';
import { ConfigurarPermissoesDto } from './dto/configurar-permissoes.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class ToggleEstadoDto {
  @IsString() estado: string;
}

@ApiTags('rh-funcionarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh/funcionarios')
export class FuncionariosController {
  constructor(private funcionariosService: FuncionariosService) {}

  @Get()
  @Roles('ADMIN', 'GESTOR_RH', 'SUPER_ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar funcionários' })
  findAll(@Query() query: FuncionarioQueryDto, @Request() req: any) {
    return this.funcionariosService.findAll(query, req.user.role);
  }

  @Get(':id')
  @Roles('ADMIN', 'GESTOR_RH', 'SUPER_ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Obter funcionário por ID' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.funcionariosService.findOne(id, req.user.role);
  }

  @Post()
  @Roles('ADMIN', 'GESTOR_RH', 'SUPER_ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Criar funcionário (admissão)' })
  create(@Body() dto: CreateFuncionarioDto, @CurrentUser('id') userId: string) {
    return this.funcionariosService.create(dto, userId);
  }

  @Put(':id')
  @Roles('ADMIN', 'GESTOR_RH', 'SUPER_ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Atualizar dados do funcionário' })
  update(@Param('id') id: string, @Body() dto: UpdateFuncionarioDto) {
    return this.funcionariosService.update(id, dto);
  }

  @Put(':id/estado')
  @Roles('ADMIN', 'GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Alterar estado do funcionário (ex: FERIAS, SUSPENSO, ATIVO)' })
  toggleEstado(@Param('id') id: string, @Body() dto: ToggleEstadoDto, @CurrentUser('id') userId: string) {
    return this.funcionariosService.toggleEstado(id, dto.estado, userId);
  }

  @Put(':id/permissoes')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Configurar permissões de acesso do funcionário (role do sistema)' })
  configurarPermissoes(
    @Param('id') id: string,
    @Body() dto: ConfigurarPermissoesDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') actorRole: string,
  ) {
    return this.funcionariosService.configurarPermissoes(id, dto, userId, actorRole);
  }
}
