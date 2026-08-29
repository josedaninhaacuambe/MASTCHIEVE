import {
  Controller, Get, Put, Post, Param, Body, UseGuards,
  UseInterceptors, UploadedFile, SetMetadata,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { LinkPartilhaService } from './link-partilha.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

const Public = () => SetMetadata('isPublic', true);

class UpdateLinkPartilhaDto {
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() titulo?: string;
  @IsOptional() @IsString() subtitulo?: string;
  @IsOptional() @IsString() conteudo?: string;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsString() ctaTexto?: string;
  @IsOptional() @IsString() ctaUrl?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
}

const storage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

@ApiTags('link-partilha')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('link-partilha')
export class LinkPartilhaController {
  constructor(private service: LinkPartilhaService) {}

  @Get('public/:chave')
  @Public()
  @ApiOperation({ summary: 'Conteúdo público de uma página de partilha (sem autenticação)' })
  findPublic(@Param('chave') chave: string) {
    return this.service.findPublicByChave(chave);
  }

  @Get()
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar links de partilha (Central de Partilha)' })
  findAll() {
    return this.service.findAll();
  }

  @Put(':chave')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Atualizar conteúdo de uma página de partilha' })
  update(@Param('chave') chave: string, @Body() dto: UpdateLinkPartilhaDto) {
    return this.service.update(chave, dto);
  }

  @Post(':chave/imagem')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage, limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload da imagem de capa de uma página de partilha' })
  uploadImagem(@Param('chave') chave: string, @UploadedFile() file: Express.Multer.File) {
    return this.service.atualizarImagem(chave, `/uploads/${file.filename}`);
  }
}
