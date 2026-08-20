import { Controller, Get, Post, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RelatoriosMensaisService } from './relatorios-mensais.service';
import { GerarRelatorioDto } from './dto/gerar-relatorio.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('relatorios-mensais')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('relatorios-mensais')
export class RelatoriosMensaisController {
  constructor(private service: RelatoriosMensaisService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar relatórios mensais gerados' })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Obter relatório mensal por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('gerar')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Gerar (ou regenerar) o relatório mensal agregado de um mês/unidade' })
  gerar(@Body() dto: GerarRelatorioDto, @CurrentUser('id') userId: string) {
    return this.service.gerar(dto, userId);
  }

  @Get(':id/export')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Exportar relatório mensal em PDF' })
  async exportPdf(@Param('id') id: string, @Res() res: Response) {
    const relatorio = await this.service.findOne(id);
    const buffer = await this.service.exportPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="mastchieve-relatorio-${relatorio.ano}-${relatorio.mes}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
