import { Controller, Get, Put, Patch, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InstructorsService } from './instructors.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

class NotifyDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() body: string;
}

@ApiTags('instructors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('instructors')
export class InstructorsController {
  constructor(private service: InstructorsService) {}

  @Get() @Roles('ADMIN') @ApiOperation({ summary: 'Listar instrutores' })
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get(':id') @Roles('ADMIN') @ApiOperation({ summary: 'Detalhes do instrutor' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id') @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Atualizar instrutor' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Patch(':id/toggle') @Roles('ADMIN') @ApiOperation({ summary: 'Ativar/desativar instrutor' })
  toggle(@Param('id') id: string) { return this.service.toggleActive(id); }

  @Post(':id/notify') @Roles('ADMIN') @ApiOperation({ summary: 'Enviar notificação ao instrutor' })
  notify(@Param('id') id: string, @Body() dto: NotifyDto) {
    return this.service.sendNotification(id, dto.title, dto.body);
  }

  @Get(':id/stats') @Roles('ADMIN') @ApiOperation({ summary: 'Estatísticas do instrutor' })
  getStats(@Param('id') id: string) { return this.service.getStats(id); }
}
