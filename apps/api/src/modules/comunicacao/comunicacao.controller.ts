import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ComunicacaoService } from './comunicacao.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('comunicacao')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comunicacao')
export class ComunicacaoController {
  constructor(private readonly svc: ComunicacaoService) {}

  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() body: any, @Request() req: any) { return this.svc.create(body, req.user.userId); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Put(':id/aprovar') aprovar(@Param('id') id: string, @Request() req: any) { return this.svc.aprovar(id, req.user.userId); }
  @Put(':id/publicar') publicar(@Param('id') id: string, @Body() body: any) { return this.svc.publicar(id, body.link); }
}
