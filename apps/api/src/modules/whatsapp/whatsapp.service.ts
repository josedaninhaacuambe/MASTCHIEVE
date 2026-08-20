import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class WhatsappService {
  constructor(private prisma: PrismaService) {}

  async enqueue(data: {
    tipo: string;
    telefone: string;
    mensagem: string;
    studentId?: string;
    leadId?: string;
    criadoPorId?: string;
  }) {
    return this.prisma.mensagemWhatsapp.create({ data });
  }

  async findAll(estado?: string) {
    return this.prisma.mensagemWhatsapp.findMany({
      where: estado ? { estado } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { firstName: true, lastName: true } },
        lead: { select: { nome: true } },
      },
    });
  }

  async marcarEnviada(id: string, userId: string) {
    const mensagem = await this.prisma.mensagemWhatsapp.findUnique({ where: { id } });
    if (!mensagem) throw new NotFoundException('Mensagem não encontrada');
    return this.prisma.mensagemWhatsapp.update({
      where: { id },
      data: { estado: 'ENVIADA', enviadoPorId: userId, enviadoEm: new Date() },
    });
  }

  async cancelar(id: string) {
    const mensagem = await this.prisma.mensagemWhatsapp.findUnique({ where: { id } });
    if (!mensagem) throw new NotFoundException('Mensagem não encontrada');
    return this.prisma.mensagemWhatsapp.update({ where: { id }, data: { estado: 'CANCELADA' } });
  }
}
