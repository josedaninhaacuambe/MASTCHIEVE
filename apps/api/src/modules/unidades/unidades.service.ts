import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class UnidadesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.unidade.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const u = await this.prisma.unidade.findUnique({ where: { id } });
    if (!u) throw new NotFoundException('Unidade não encontrada');
    return u;
  }

  create(data: any) {
    return this.prisma.unidade.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.unidade.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.unidade.update({ where: { id }, data: { ativo: false } });
  }

  async stats(id: string) {
    const [turmas, estudantes, leads, incidentes] = await Promise.all([
      this.prisma.class.count({ where: { unidadeId: id } }),
      this.prisma.student.count({ where: { unidadeId: id, isActive: true } }),
      this.prisma.lead.count({ where: { unidadeId: id } }),
      this.prisma.incidente.count({ where: { unidadeId: id } }),
    ]);
    return { turmas, estudantes, leads, incidentes };
  }
}
