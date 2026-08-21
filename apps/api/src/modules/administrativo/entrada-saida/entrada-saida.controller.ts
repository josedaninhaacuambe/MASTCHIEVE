import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EntradaSaidaService } from './entrada-saida.service';
import { CreatePessoaAutorizadaDto } from './dto/create-pessoa-autorizada.dto';
import { CreateRegistoDto } from './dto/create-registo.dto';
import { BulkRegistoDto } from './dto/create-registo-bulk.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('entrada-saida')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('entrada-saida')
export class EntradaSaidaController {
  constructor(private service: EntradaSaidaService) {}

  @Get('pessoas-autorizadas/:studentId')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar pessoas autorizadas a buscar o atleta' })
  findPessoasAutorizadas(@Param('studentId') studentId: string) {
    return this.service.findPessoasAutorizadas(studentId);
  }

  @Post('pessoas-autorizadas')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Registar pessoa autorizada a buscar o atleta' })
  createPessoaAutorizada(@Body() dto: CreatePessoaAutorizadaDto, @CurrentUser('id') userId: string) {
    return this.service.createPessoaAutorizada(dto, userId);
  }

  @Delete('pessoas-autorizadas/:id')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Desativar pessoa autorizada' })
  removePessoaAutorizada(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.removePessoaAutorizada(id, userId);
  }

  @Get('registos')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar registos de entrada/saída de alunos' })
  findRegistos(@Query() query: any) {
    return this.service.findRegistos(query);
  }

  @Post('registos')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Registar entrada ou saída de aluno' })
  createRegisto(@Body() dto: CreateRegistoDto, @CurrentUser('id') userId: string) {
    return this.service.createRegisto(dto, userId);
  }

  @Post('registos/bulk')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Registar entrada ou saída em grupo (por turma)' })
  createRegistoBulk(@Body() dto: BulkRegistoDto, @CurrentUser('id') userId: string) {
    return this.service.createRegistoBulk(dto, userId);
  }
}
