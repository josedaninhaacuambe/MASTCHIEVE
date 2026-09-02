import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

const QR_PREFIX = 'mastchieve:qr:v1:';

@Injectable()
export class StudentsQrService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private config: ConfigService,
  ) {}

  private getKey(): Buffer {
    const secret = this.config.get<string>('QR_TOKEN_SECRET');
    return crypto.createHash('sha256').update(secret ?? '').digest();
  }

  private encrypt(token: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  private decrypt(payload: string): string {
    const raw = Buffer.from(payload, 'base64');
    const iv = raw.subarray(0, 12);
    const authTag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.getKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  private async buildImage(token: string): Promise<string> {
    return QRCode.toDataURL(QR_PREFIX + token, { errorCorrectionLevel: 'M', margin: 2, width: 480 });
  }

  private async assertStudentExists(studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Atleta não encontrado');
    return student;
  }

  async generate(studentId: string, actorUserId: string) {
    const student = await this.assertStudentExists(studentId);
    if (!student.userId) {
      throw new BadRequestException('Este atleta não tem conta própria — o encarregado acede pelo painel dele.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenEncrypted = this.encrypt(token);

    const credential = await this.prisma.$transaction(async (tx) => {
      await tx.studentQrCredential.updateMany({
        where: { studentId, ativo: true },
        data: { ativo: false, revogadoEm: new Date() },
      });
      return tx.studentQrCredential.create({
        data: { studentId, tokenHash, tokenEncrypted, criadoPorId: actorUserId },
      });
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'STUDENT_QR_GERADO',
      entity: 'Student',
      entityId: studentId,
      newValues: { credentialId: credential.id },
    });

    return { qrImage: await this.buildImage(token), generatedAt: credential.registadoEm };
  }

  async getCurrent(studentId: string) {
    const student = await this.assertStudentExists(studentId);
    if (!student.userId) {
      throw new BadRequestException('Este atleta não tem conta própria — o encarregado acede pelo painel dele.');
    }

    const credential = await this.prisma.studentQrCredential.findFirst({
      where: { studentId, ativo: true },
      orderBy: { registadoEm: 'desc' },
    });
    if (!credential) return null;

    const token = this.decrypt(credential.tokenEncrypted);
    return { qrImage: await this.buildImage(token), generatedAt: credential.registadoEm };
  }

  async revoke(studentId: string, actorUserId: string) {
    await this.assertStudentExists(studentId);

    const credential = await this.prisma.studentQrCredential.findFirst({
      where: { studentId, ativo: true },
    });
    if (!credential) return { revoked: false };

    await this.prisma.studentQrCredential.update({
      where: { id: credential.id },
      data: { ativo: false, revogadoEm: new Date() },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'STUDENT_QR_REVOGADO',
      entity: 'Student',
      entityId: studentId,
      oldValues: { credentialId: credential.id },
    });

    return { revoked: true };
  }
}
