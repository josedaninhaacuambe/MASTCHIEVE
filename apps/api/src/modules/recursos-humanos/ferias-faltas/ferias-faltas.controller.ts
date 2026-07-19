import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { FeriasFaltasService } from './ferias-faltas.service';
import { CreateFeriasFaltaDto } from './dto/create-ferias-falta.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

class RejeitarFeriasFaltaDto {
  @IsOptional() @IsString() motivoRejeicao?: string;
}

@ApiTags('rh-ferias-faltas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh/ferias-faltas')
export class FeriasFaltasController {
  constructor(private service: FeriasFaltasService) {}

  @Get()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar pedidos de férias/faltas' })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Obter pedido por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Lançar pedido de férias/falta em nome do funcionário' })
  create(@Body() dto: CreateFeriasFaltaDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Put(':id/aprovar')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Aprovar pedido (pedidos excecionais exigem Super Admin)' })
  aprovar(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.service.aprovar(id, userId, role);
  }

  @Put(':id/rejeitar')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Rejeitar pedido' })
  rejeitar(
    @Param('id') id: string,
    @Body() dto: RejeitarFeriasFaltaDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.rejeitar(id, dto.motivoRejeicao, userId, role);
  }
}
