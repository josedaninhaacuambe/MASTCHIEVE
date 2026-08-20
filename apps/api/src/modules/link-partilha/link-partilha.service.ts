import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class LinkPartilhaService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.linkPartilha.findMany({ orderBy: { chave: 'asc' } });
  }

  async update(chave: string, data: { url?: string; label?: string }) {
    const link = await this.prisma.linkPartilha.findUnique({ where: { chave } });
    if (!link) throw new NotFoundException('Link de partilha não encontrado');
    return this.prisma.linkPartilha.update({ where: { chave }, data });
  }
}
