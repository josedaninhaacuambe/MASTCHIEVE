import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async findByStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Atleta não encontrado');

    return this.prisma.document.findMany({
      where: { studentId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async create(studentId: string, file: Express.Multer.File, type: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Atleta não encontrado');

    const url = `/uploads/${file.filename}`;

    return this.prisma.document.create({
      data: {
        studentId,
        name: file.originalname,
        type: type || 'OTHER',
        url,
        size: file.size,
      },
    });
  }

  async remove(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    return this.prisma.document.delete({ where: { id } });
  }
}
