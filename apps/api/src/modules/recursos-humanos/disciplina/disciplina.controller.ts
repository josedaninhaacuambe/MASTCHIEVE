import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DisciplinaService } from './disciplina.service';
import { CreateOcorrenciaDto } from './dto/create-ocorrencia.dto';
import { DecidirOcorrenciaDto } from './dto/decidir-ocorrencia.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('rh-disciplina')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh/disciplina')
export class DisciplinaController {
  constructor(private service: DisciplinaService) {}

  @Get()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar ocorrências disciplinares' })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Obter ocorrência por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Registar ocorrência disciplinar (graves são automaticamente escaladas ao Super Admin)' })
  create(@Body() dto: CreateOcorrenciaDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Put(':id/decidir')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Decidir ocorrência (ocorrências graves exigem Super Admin)' })
  decidir(
    @Param('id') id: string,
    @Body() dto: DecidirOcorrenciaDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.decidir(id, dto, userId, role);
  }
}
