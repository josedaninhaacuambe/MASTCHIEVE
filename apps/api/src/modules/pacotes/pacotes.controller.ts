import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PacotesService } from './pacotes.service';
import { CreatePacoteDto, UpdatePacoteDto } from './dto/pacote.dto';

@ApiTags('pacotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pacotes')
export class PacotesController {
  constructor(private service: PacotesService) {}

  @Get()
  @Roles('ADMIN', 'ASSISTENTE_ADMIN', 'FINANCIAL', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Listar pacotes (activos; ?todos=true inclui inactivos)' })
  listar(@Query('todos') todos?: string) {
    return this.service.listar(todos === 'true');
  }

  // Escrita: só ADMIN (o SUPER_ADMIN passa sempre no RolesGuard).
  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar pacote e preço (ADMIN / SUPER_ADMIN)' })
  criar(@Body() dto: CreatePacoteDto, @CurrentUser('id') userId: string) {
    return this.service.criar(dto, userId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Alterar pacote ou preço (ADMIN / SUPER_ADMIN)' })
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePacoteDto, @CurrentUser('id') userId: string) {
    return this.service.actualizar(id, dto, userId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Desactivar pacote (não apaga o histórico)' })
  desactivar(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.service.desactivar(id, userId);
  }
}
