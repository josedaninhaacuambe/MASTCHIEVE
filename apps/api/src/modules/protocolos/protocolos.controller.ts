import { Controller, Get, Put, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProtocolosService } from './protocolos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('protocolos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('protocolos')
export class ProtocolosController {
  constructor(private svc: ProtocolosService) {}

  @Get() @Roles('ADMIN', 'INSTRUCTOR', 'ADMIN') @ApiOperation({ summary: 'Listar protocolos de segurança' })
  findAll() { return this.svc.findAll(); }

  @Get('stats') @Roles('ADMIN', 'ADMIN') @ApiOperation({ summary: 'Protocolos com contagem de incidentes' })
  stats() { return this.svc.stats(); }

  @Get(':id') @Roles('ADMIN', 'INSTRUCTOR', 'ADMIN') @ApiOperation({ summary: 'Detalhes do protocolo' })
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Put(':id') @Roles('ADMIN') @ApiOperation({ summary: 'Editar protocolo (Admin)' })
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

  // Checklists
  @Get('checklists/list') @Roles('ADMIN', 'INSTRUCTOR', 'ADMIN') @ApiOperation({ summary: 'Listar checklists preenchidas' })
  findChecklists(@Query() q: any) { return this.svc.findChecklists(q); }

  @Post('checklists') @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Preencher checklist de protocolo' })
  createChecklist(@Body() body: any, @Request() req: any) {
    return this.svc.createChecklist(body, req.user.userId);
  }

  @Put('checklists/:id') @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Atualizar checklist' })
  updateChecklist(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateChecklist(id, body);
  }
}
