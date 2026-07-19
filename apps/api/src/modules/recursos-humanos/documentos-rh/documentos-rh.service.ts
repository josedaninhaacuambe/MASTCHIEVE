import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';

@Injectable()
export class DocumentosRhService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async findByFuncionario(funcionarioId: string) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { id: funcionarioId } });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado');
    return this.prisma.documentoRH.findMany({ where: { funcionarioId }, orderBy: { uploadedAt: 'desc' } });
  }

  async findByCandidatura(candidaturaId: string) {
    const candidatura = await this.prisma.candidatura.findUnique({ where: { id: candidaturaId } });
    if (!candidatura) throw new NotFoundException('Candidatura não encontrada');
    return this.prisma.documentoRH.findMany({ where: { candidaturaId }, orderBy: { uploadedAt: 'desc' } });
  }

  async upload(
    file: Express.Multer.File,
    tipo: string,
    funcionarioId: string | undefined,
    candidaturaId: string | undefined,
    actorUserId: string,
  ) {
    if (funcionarioId) {
      const funcionario = await this.prisma.funcionario.findUnique({ where: { id: funcionarioId } });
      if (!funcionario) throw new NotFoundException('Funcionário não encontrado');
    }
    if (candidaturaId) {
      const candidatura = await this.prisma.candidatura.findUnique({ where: { id: candidaturaId } });
      if (!candidatura) throw new NotFoundException('Candidatura não encontrada');
    }

    const url = `/uploads/${file.filename}`;
    const documento = await this.prisma.documentoRH.create({
      data: {
        funcionarioId,
        candidaturaId,
        tipo: tipo || 'OUTRO',
        nome: file.originalname,
        url,
        size: file.size,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'DOCUMENTO_RH_CRIADO',
      entity: 'DocumentoRH',
      entityId: documento.id,
      newValues: { tipo, funcionarioId, candidaturaId },
    });

    return documento;
  }

  async validar(id: string, actorUserId: string) {
    const documento = await this.prisma.documentoRH.findUnique({ where: { id } });
    if (!documento) throw new NotFoundException('Documento não encontrado');

    const updated = await this.prisma.documentoRH.update({
      where: { id },
      data: { validado: true, validadoPorId: actorUserId, validadoEm: new Date() },
    });

    await this.audit.log({ userId: actorUserId, action: 'DOCUMENTO_RH_VALIDADO', entity: 'DocumentoRH', entityId: id });
    return updated;
  }

  async remove(id: string) {
    const documento = await this.prisma.documentoRH.findUnique({ where: { id } });
    if (!documento) throw new NotFoundException('Documento não encontrado');
    return this.prisma.documentoRH.delete({ where: { id } });
  }
}
