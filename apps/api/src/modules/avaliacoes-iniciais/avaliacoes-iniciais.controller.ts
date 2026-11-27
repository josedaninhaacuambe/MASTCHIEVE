import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AvaliacoesIniciaisService } from './avaliacoes-iniciais.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateAvaliacaoInicialDto, UpdateAvaliacaoInicialDto } from './dto/avaliacao-inicial.dto';

@ApiTags('avaliacoes-iniciais')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('avaliacoes-iniciais')
export class AvaliacoesIniciaisController {
  constructor(private readonly svc: AvaliacoesIniciaisService) {}

  @Get()
  @Roles('ADMIN', 'INSTRUCTOR', 'MANAGER', 'ASSISTENTE_ADMIN')
  findAll(@Query() q: any) { return this.svc.findAll(q); }

  @Get('estudante/:studentId')
  @Roles('ADMIN', 'INSTRUCTOR', 'MANAGER', 'ASSISTENTE_ADMIN')
  findByStudent(@Param('studentId') id: string) { return this.svc.findByStudent(id); }

  @Get(':id')
  @Roles('ADMIN', 'INSTRUCTOR', 'MANAGER', 'ASSISTENTE_ADMIN')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  @Roles('ADMIN', 'INSTRUCTOR')
  create(@Body() dto: CreateAvaliacaoInicialDto, @CurrentUser() user: { id: string; role: string }) { return this.svc.create(dto, user); }

  @Put(':id')
  @Roles('ADMIN', 'INSTRUCTOR')
  update(@Param('id') id: string, @Body() dto: UpdateAvaliacaoInicialDto, @CurrentUser() user: { id: string; role: string }) { return this.svc.update(id, dto, user); }

  @Put(':id/aprovar')
  @Roles('ADMIN', 'INSTRUCTOR')
  aprovar(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) { return this.svc.aprovar(id, user); }
}
