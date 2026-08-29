import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class LinkPartilhaService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.linkPartilha.findMany({ orderBy: { chave: 'asc' } });
  }

  async findPublicByChave(chave: string) {
    const link = await this.prisma.linkPartilha.findUnique({ where: { chave } });
    if (!link || !link.ativo) throw new NotFoundException('Página não encontrada');
    const { id, ativo, createdAt, updatedAt, ...conteudoPublico } = link;
    return conteudoPublico;
  }

  async update(
    chave: string,
    data: {
      label?: string;
      titulo?: string;
      subtitulo?: string;
      conteudo?: string;
      videoUrl?: string;
      ctaTexto?: string;
      ctaUrl?: string;
      ativo?: boolean;
    },
  ) {
    const link = await this.prisma.linkPartilha.findUnique({ where: { chave } });
    if (!link) throw new NotFoundException('Link de partilha não encontrado');
    return this.prisma.linkPartilha.update({ where: { chave }, data });
  }

  async atualizarImagem(chave: string, imagemUrl: string) {
    const link = await this.prisma.linkPartilha.findUnique({ where: { chave } });
    if (!link) throw new NotFoundException('Link de partilha não encontrado');
    return this.prisma.linkPartilha.update({ where: { chave }, data: { imagemUrl } });
  }
}
