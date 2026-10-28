import {
  Controller, Get, Put, Patch, Post, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InstructorsService } from './instructors.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { imageStorage, imageFileFilter } from '../../common/utils/upload.util';

class NotifyDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() body: string;
}

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

@ApiTags('instructors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('instructors')
export class InstructorsController {
  constructor(private service: InstructorsService) {}

  @Get() @Roles('ADMIN', 'ASSISTENTE_ADMIN') @ApiOperation({ summary: 'Listar instrutores' })
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get('options') @Roles('ADMIN', 'ASSISTENTE_ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Lista resumida de instrutores activos (todas as unidades) para atribuição a turmas/aulas' })
  options() { return this.service.options(); }

  @Get(':id') @Roles('ADMIN', 'ASSISTENTE_ADMIN') @ApiOperation({ summary: 'Detalhes do instrutor' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id') @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Atualizar instrutor' })
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.service.update(id, dto, user);
  }

  @Post(':id/avatar') @Roles('ADMIN', 'ASSISTENTE_ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Carregar/substituir fotografia de perfil do instrutor' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: imageStorage, fileFilter: imageFileFilter, limits: { fileSize: AVATAR_MAX_BYTES } }))
  uploadAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    if (!file) throw new BadRequestException('Nenhuma imagem enviada (máx. 5 MB, JPEG/PNG/WEBP/HEIC)');
    return this.service.setAvatar(id, file, user);
  }

  @Delete(':id/avatar') @Roles('ADMIN', 'ASSISTENTE_ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Remover fotografia de perfil do instrutor' })
  removeAvatar(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.removeAvatar(id, user);
  }

  @Patch(':id/toggle') @Roles('ADMIN') @ApiOperation({ summary: 'Ativar/desativar instrutor' })
  toggle(@Param('id') id: string) { return this.service.toggleActive(id); }

  @Post(':id/notify') @Roles('ADMIN') @ApiOperation({ summary: 'Enviar notificação ao instrutor' })
  notify(@Param('id') id: string, @Body() dto: NotifyDto) {
    return this.service.sendNotification(id, dto.title, dto.body);
  }

  @Get(':id/stats') @Roles('ADMIN') @ApiOperation({ summary: 'Estatísticas do instrutor' })
  getStats(@Param('id') id: string) { return this.service.getStats(id); }
}
