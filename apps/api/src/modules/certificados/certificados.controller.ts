import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { CertificadosService } from './certificados.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('certificados')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('certificados')
export class CertificadosController {
  constructor(private readonly svc: CertificadosService) {}

  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Get('atleta/:studentId') findByAtleta(@Param('studentId') id: string) { return this.svc.findByAtleta(id); }
  @Post() create(@Body() body: any, @Request() req: any) { return this.svc.create(body, req.user.userId); }
}
