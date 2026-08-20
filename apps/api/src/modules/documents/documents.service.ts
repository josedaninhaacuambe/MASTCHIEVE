import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { DOCUMENTOS_INSCRICAO_OBRIGATORIOS } from '../../common/constants/documentos';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private static readonly CLEARED_FOR_CONFIDENCIAL = ['ADMIN', 'SUPER_ADMIN', 'ASSISTENTE_ADMIN', 'MANAGER'];

  async findByStudent(studentId: string, requesterRole?: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Atleta não encontrado');

    const docs = await this.prisma.document.findMany({
      where: { studentId },
      orderBy: { uploadedAt: 'desc' },
    });

    if (requesterRole && DocumentsService.CLEARED_FOR_CONFIDENCIAL.includes(requesterRole)) {
      return docs;
    }
    return docs.filter((d) => !d.confidencial);
  }

  async create(
    studentId: string,
    file: Express.Multer.File,
    type: string,
    actorUserId?: string,
    extra?: { categoria?: string; unidadeId?: string; confidencial?: boolean; retencaoAte?: string },
  ) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Atleta não encontrado');

    const url = `/uploads/${file.filename}`;

    const doc = await this.prisma.document.create({
      data: {
        studentId,
        name: file.originalname,
        type: type || 'OTHER',
        url,
        size: file.size,
        categoria: extra?.categoria || 'OUTRO',
        unidadeId: extra?.unidadeId || student.unidadeId || undefined,
        confidencial: extra?.confidencial ?? false,
        retencaoAte: extra?.retencaoAte ? new Date(extra.retencaoAte) : undefined,
      },
    });

    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId,
        action: 'DOCUMENT_CRIADO',
        entity: 'Document',
        entityId: doc.id,
        newValues: { studentId, name: doc.name, type: doc.type },
      });
    }

    return doc;
  }

  async remove(id: string, actorUserId?: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    const removed = await this.prisma.document.delete({ where: { id } });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId,
        action: 'DOCUMENT_REMOVIDO',
        entity: 'Document',
        entityId: id,
        oldValues: { studentId: doc.studentId, name: doc.name, type: doc.type },
      });
    }
    return removed;
  }

  async validar(id: string, actorUserId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Documento não encontrado');

    const updated = await this.prisma.document.update({
      where: { id },
      data: { validado: true, validadoPorId: actorUserId, validadoEm: new Date() },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'DOCUMENT_VALIDADO',
      entity: 'Document',
      entityId: id,
    });

    // Se todos os documentos obrigatórios de inscrição estiverem validados, conclui a inscrição
    if ((DOCUMENTOS_INSCRICAO_OBRIGATORIOS as readonly string[]).includes(doc.type)) {
      const docs = await this.prisma.document.findMany({ where: { studentId: doc.studentId } });
      const completo = DOCUMENTOS_INSCRICAO_OBRIGATORIOS.every((type) =>
        docs.some((d) => d.type === type && (d.id === id ? true : d.validado)),
      );
      if (completo) {
        await this.prisma.student.updateMany({
          where: { id: doc.studentId, estadoInscricao: 'DOCUMENTOS_PENDENTES' },
          data: { estadoInscricao: 'COMPLETA' },
        });
      }
    }

    return updated;
  }
}
