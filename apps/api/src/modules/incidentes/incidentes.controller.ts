import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { IncidentesService } from './incidentes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('incidentes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('incidentes')
export class IncidentesController {
  constructor(private readonly svc: IncidentesService) {}

  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }
  @Get('stats') stats() { return this.svc.stats(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() body: any, @Request() req: any) { return this.svc.create(body, req.user.userId); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
}
