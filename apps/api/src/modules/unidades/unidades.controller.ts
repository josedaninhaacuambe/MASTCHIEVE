import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { UnidadesService } from './unidades.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('unidades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('unidades')
export class UnidadesController {
  constructor(private readonly svc: UnidadesService) {}

  @Get() findAll() { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Get(':id/stats') stats(@Param('id') id: string) { return this.svc.stats(id); }
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Delete(':id') @Roles('ADMIN', 'SUPER_ADMIN') remove(@Param('id') id: string) { return this.svc.remove(id); }
}
