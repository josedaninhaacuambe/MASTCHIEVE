import {
  Controller, Get, Post, Put, Delete, Param, Query, UseGuards,
  UseInterceptors, UploadedFile, Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { DocumentosRhService } from './documentos-rh.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

const storage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

@ApiTags('rh-documentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh/documentos')
export class DocumentosRhController {
  constructor(private service: DocumentosRhService) {}

  @Get('funcionario/:funcionarioId')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar documentos de um funcionário' })
  findByFuncionario(@Param('funcionarioId') funcionarioId: string) {
    return this.service.findByFuncionario(funcionarioId);
  }

  @Get('candidatura/:candidaturaId')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar documentos de uma candidatura' })
  findByCandidatura(@Param('candidaturaId') candidaturaId: string) {
    return this.service.findByCandidatura(candidaturaId);
  }

  @Post()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Fazer upload de documento de RH (BI, certificado, contrato, etc.)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage, limits: { fileSize: 10 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('tipo') tipo: string,
    @Body('funcionarioId') funcionarioId: string | undefined,
    @Body('candidaturaId') candidaturaId: string | undefined,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.upload(file, tipo, funcionarioId, candidaturaId, userId);
  }

  @Put(':id/validar')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Validar documento de RH' })
  validar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.validar(id, userId);
  }

  @Delete(':id')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Remover documento de RH' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
