import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class CertificadosService {
  constructor(private prisma: PrismaService) {}

  findAll(query: any = {}) {
    const where: any = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.eventoId) where.eventoId = query.eventoId;
    return this.prisma.certificado.findMany({
      where, orderBy: { dataEmissao: 'desc' },
      include: { student: { select: { firstName: true, lastName: true } }, fase: true, validadoPor: { select: { email: true } } },
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.certificado.findUnique({
      where: { id }, include: { student: true, fase: true, validadoPor: true, evento: true },
    });
    if (!c) throw new NotFoundException('Certificado não encontrado');
    return c;
  }

  async create(data: any, validadoPorId: string) {
    const serie = `MAST-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    return this.prisma.certificado.create({
      data: { ...data, validadoPorId, numeroSerie: serie },
      include: { student: true, fase: true },
    });
  }

  findByAtleta(studentId: string) {
    return this.prisma.certificado.findMany({
      where: { studentId }, orderBy: { dataEmissao: 'desc' },
      include: { fase: true, evento: { select: { nome: true, data: true } } },
    });
  }
}
