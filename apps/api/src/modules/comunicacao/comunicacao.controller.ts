import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ComunicacaoService } from './comunicacao.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateAtendimentoDto, UpdateAtendimentoDto } from './dto/atendimento.dto';

@ApiTags('comunicacao')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('comunicacao')
export class ComunicacaoController {
  constructor(private readonly svc: ComunicacaoService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  findAll(@Query() q: any) { return this.svc.findAll(q); }

  @Get('atendimentos')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN', 'INSTRUCTOR')
  listAtendimentos(@Query('estado') estado?: string, @Query('studentId') studentId?: string) {
    return this.svc.listAtendimentos({ estado, studentId });
  }

  @Post('atendimentos')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN', 'INSTRUCTOR')
  createAtendimento(@Body() dto: CreateAtendimentoDto, @Request() req: any) {
    return this.svc.createAtendimento(dto, req.user.id);
  }

  @Put('atendimentos/:id')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN', 'INSTRUCTOR')
  updateAtendimento(@Param('id') id: string, @Body() dto: UpdateAtendimentoDto, @Request() req: any) {
    return this.svc.updateAtendimento(id, dto, req.user.id);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  create(@Body() body: any, @Request() req: any) { return this.svc.create(body, req.user.id); }

  @Put(':id')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.update(id, body, req.user.id);
  }

  @Put(':id/aprovar')
  @Roles('ADMIN', 'MANAGER')
  aprovar(@Param('id') id: string, @Request() req: any) { return this.svc.aprovar(id, req.user.id); }

  @Put(':id/publicar')
  @Roles('ADMIN', 'MANAGER')
  publicar(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.publicar(id, body.link, req.user.id);
  }
}
