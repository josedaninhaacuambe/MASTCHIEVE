import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class AvaliacoesIniciaisService {
  constructor(private prisma: PrismaService) {}

  findAll(query: any = {}) {
    const where: any = {};
    if (query.instrutorId) where.instrutorId = query.instrutorId;
    return this.prisma.avaliacaoInicial.findMany({
      where, orderBy: { data: 'desc' },
      include: { student: { select: { firstName: true, lastName: true } }, instrutor: { select: { firstName: true, lastName: true } }, faseRecomendada: true },
    });
  }

  async findOne(id: string) {
    const a = await this.prisma.avaliacaoInicial.findUnique({
      where: { id }, include: { student: true, instrutor: true, faseRecomendada: true },
    });
    if (!a) throw new NotFoundException('Avaliação não encontrada');
    return a;
  }

  findByStudent(studentId: string) {
    return this.prisma.avaliacaoInicial.findUnique({
      where: { studentId },
      include: { faseRecomendada: true, instrutor: { select: { firstName: true, lastName: true } } },
    });
  }

  create(data: any, instrutorId: string) {
    return this.prisma.avaliacaoInicial.create({ data: { ...data, instrutorId } });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.avaliacaoInicial.update({ where: { id }, data });
  }

  async aprovar(id: string, aprovadoPorId: string) {
    return this.prisma.avaliacaoInicial.update({
      where: { id }, data: { aprovadoPorId, aprovadoEm: new Date() },
    });
  }
}
