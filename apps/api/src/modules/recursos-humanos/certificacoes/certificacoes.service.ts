import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreateCertificacaoDto } from './dto/create-certificacao.dto';

const TIPOS_BLOQUEANTES = ['NADADOR_SALVADOR', 'INSTRUTOR_NATACAO'];

@Injectable()
export class CertificacoesService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  findByFuncionario(funcionarioId: string) {
    return this.prisma.certificacaoFuncionario.findMany({
      where: { funcionarioId },
      orderBy: { dataValidade: 'asc' },
    });
  }

  async findOne(id: string) {
    const cert = await this.prisma.certificacaoFuncionario.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certificação não encontrada');
    return cert;
  }

  async create(dto: CreateCertificacaoDto, actorUserId: string) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { id: dto.funcionarioId } });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado');

    const cert = await this.prisma.certificacaoFuncionario.create({
      data: {
        ...dto,
        dataEmissao: dto.dataEmissao ? new Date(dto.dataEmissao) : undefined,
        dataValidade: dto.dataValidade ? new Date(dto.dataValidade) : undefined,
      },
    });
    await this.audit.log({ userId: actorUserId, action: 'CERTIFICACAO_CRIADA', entity: 'CertificacaoFuncionario', entityId: cert.id });
    return cert;
  }

  async revogar(id: string, actorUserId: string) {
    await this.findOne(id);
    const updated = await this.prisma.certificacaoFuncionario.update({ where: { id }, data: { estado: 'REVOGADA' } });
    await this.audit.log({ userId: actorUserId, action: 'CERTIFICACAO_REVOGADA', entity: 'CertificacaoFuncionario', entityId: id });
    return updated;
  }

  async assertCertificacoesValidas(funcionarioId: string) {
    const certs = await this.prisma.certificacaoFuncionario.findMany({
      where: { funcionarioId, tipo: { in: TIPOS_BLOQUEANTES } },
      orderBy: { createdAt: 'desc' },
    });
    const now = new Date();
    const ultimaPorTipo = new Map<string, (typeof certs)[number]>();
    for (const cert of certs) {
      if (!ultimaPorTipo.has(cert.tipo)) ultimaPorTipo.set(cert.tipo, cert);
    }
    const invalida = [...ultimaPorTipo.values()].find(
      (c) => c.estado === 'REVOGADA' || (c.dataValidade && c.dataValidade < now),
    );
    if (invalida) {
      throw new ConflictException(
        `Certificação ${invalida.tipo} do funcionário está expirada ou revogada — não é possível atribuir a turmas/escalas`,
      );
    }
  }
}
