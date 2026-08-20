import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly svc: LeadsService) {}

  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }
  @Get('pipeline') pipeline(@Query('unidadeId') uid?: string) { return this.svc.pipeline(uid); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

  @Post('campanha')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  enviarCampanha(@Body() body: { origem?: string; estado?: string; unidadeId?: string; mensagem: string }) {
    const { mensagem, ...filtro } = body;
    return this.svc.enviarCampanha(filtro, mensagem);
  }
}
