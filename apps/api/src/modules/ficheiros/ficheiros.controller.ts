import { Controller, Get, Param, Res, SetMetadata, UseGuards, NotFoundException, Injectable, Module } from '@nestjs/common';
import { Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { access } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../config/prisma/prisma.service';

const Public = () => SetMetadata('isPublic', true);

/** Só nomes simples de imagens (sem caminhos); a extensão decide o tipo. */
export const NOME_IMAGEM_PUBLICA = /^[A-Za-z0-9_-]{1,120}\.(jpe?g|png|webp|gif)$/i;

@Injectable()
export class FicheirosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Caminho de uma imagem que já é pública por natureza: cartazes de eventos,
   * imagem do link de partilha e foto de instrutor. Qualquer outro upload
   * (documentos, comprovativos, fotos da rotina, dados de atletas) dá 404.
   */
  async caminhoImagemPublica(nome: string): Promise<string> {
    if (typeof nome !== 'string' || !NOME_IMAGEM_PUBLICA.test(nome)) throw new NotFoundException('Imagem não encontrada');
    const url = `/uploads/${nome}`;
    const [evento, partilha, instrutor] = await Promise.all([
      this.prisma.eventoImagem.findFirst({ where: { url }, select: { id: true } }),
      this.prisma.linkPartilha.findFirst({ where: { imagemUrl: url }, select: { id: true } }),
      this.prisma.instructor.findFirst({ where: { avatarUrl: url }, select: { id: true } }),
    ]);
    if (!evento && !partilha && !instrutor) throw new NotFoundException('Imagem não encontrada');
    const caminho = join(process.cwd(), 'uploads', nome);
    try { await access(caminho); } catch { throw new NotFoundException('Imagem não encontrada'); }
    return caminho;
  }
}

@ApiTags('ficheiros')
@Public()
@UseGuards(ThrottlerGuard)
@Controller('ficheiros')
export class FicheirosController {
  constructor(private readonly svc: FicheirosService) {}

  @Get('imagem/:nome')
  @Throttle({ short: { limit: 30, ttl: 1000 } })
  async imagem(@Param('nome') nome: string, @Res() res: Response) {
    const caminho = await this.svc.caminhoImagemPublica(nome);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(caminho);
  }
}

@Module({ controllers: [FicheirosController], providers: [FicheirosService] })
export class FicheirosModule {}
