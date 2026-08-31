import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, IsEmail, IsBoolean, IsIn } from 'class-validator';
import { UnidadesService } from './unidades.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

const TIPOS_UNIDADE = ['PRINCIPAL', 'COMUNITARIO', 'PREMIUM'];

class CreateUnidadeDto {
  @IsString() nome: string;
  @IsString() codigo: string;
  @IsOptional() @IsIn(TIPOS_UNIDADE) tipo?: string;
  @IsOptional() @IsString() endereco?: string;
  @IsOptional() @IsString() contacto?: string;
  @IsOptional() @IsEmail() email?: string;
}

class UpdateUnidadeDto {
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsString() codigo?: string;
  @IsOptional() @IsIn(TIPOS_UNIDADE) tipo?: string;
  @IsOptional() @IsString() endereco?: string;
  @IsOptional() @IsString() contacto?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
}

@ApiTags('unidades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('unidades')
export class UnidadesController {
  constructor(private readonly svc: UnidadesService) {}

  @Get() findAll() { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Get(':id/stats') stats(@Param('id') id: string) { return this.svc.stats(id); }

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  create(@Body() dto: CreateUnidadeDto) { return this.svc.create(dto); }

  @Put(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateUnidadeDto) { return this.svc.update(id, dto); }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
