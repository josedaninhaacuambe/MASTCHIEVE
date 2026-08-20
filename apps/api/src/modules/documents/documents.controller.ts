import {
  Controller, Get, Post, Put, Delete, Param, UseGuards,
  UseInterceptors, UploadedFile, Body, Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

const storage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private service: DocumentsService) {}

  @Get('students/:studentId')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar documentos do atleta' })
  findByStudent(@Param('studentId') studentId: string, @Request() req: any) {
    return this.service.findByStudent(studentId, req.user.role);
  }

  @Post('students/:studentId')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Fazer upload de documento' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage, limits: { fileSize: 10 * 1024 * 1024 } }))
  upload(
    @Param('studentId') studentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
    @Body('categoria') categoria: string,
    @Body('unidadeId') unidadeId: string,
    @Body('confidencial') confidencial: string,
    @Body('retencaoAte') retencaoAte: string,
    @Request() req: any,
  ) {
    return this.service.create(studentId, file, type, req.user.id, {
      categoria,
      unidadeId,
      confidencial: confidencial === 'true' || confidencial === '1',
      retencaoAte,
    });
  }

  @Put(':id/validar')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Validar documento do atleta' })
  validar(@Param('id') id: string, @Request() req: any) {
    return this.service.validar(id, req.user.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remover documento' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user.id);
  }
}
