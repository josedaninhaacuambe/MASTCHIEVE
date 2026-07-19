import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { FuncionariosService } from '../funcionarios/funcionarios.service';
import { CreateCandidaturaDto } from './dto/create-candidatura.dto';
import { AvaliarCandidaturaDto } from './dto/avaliar-candidatura.dto';
import { AprovarFinalCandidaturaDto } from './dto/aprovar-final-candidatura.dto';
import { RejeitarDto } from './dto/rejeitar.dto';

@Injectable()
export class CandidaturasService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private funcionariosService: FuncionariosService,
  ) {}

  findAll(query: any) {
    const where: any = {};
    if (query?.vagaId) where.vagaId = query.vagaId;
    if (query?.estado) where.estado = query.estado;
    return this.prisma.candidatura.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { vaga: { select: { titulo: true, cargo: true } } },
    });
  }

  async findOne(id: string) {
    const candidatura = await this.prisma.candidatura.findUnique({
      where: { id },
      include: { vaga: true, documentos: true },
    });
    if (!candidatura) throw new NotFoundException('Candidatura não encontrada');
    return candidatura;
  }

  async create(dto: CreateCandidaturaDto) {
    const vaga = await this.prisma.vaga.findUnique({ where: { id: dto.vagaId } });
    if (!vaga) throw new NotFoundException('Vaga não encontrada');
    if (vaga.estado !== 'PUBLICADA' && vaga.estado !== 'EM_TRIAGEM') {
      throw new ConflictException('Vaga não está a receber candidaturas');
    }
    return this.prisma.candidatura.create({ data: { ...dto } });
  }

  async avaliar(id: string, dto: AvaliarCandidaturaDto, actorUserId: string) {
    await this.findOne(id);
    const updated = await this.prisma.candidatura.update({
      where: { id },
      data: {
        notaEntrevista: dto.notaEntrevista,
        notaTestePratico: dto.notaTestePratico,
        observacoesRH: dto.observacoesRH,
        estado: dto.estado,
        avaliadoPorId: actorUserId,
      },
    });
    await this.audit.log({ userId: actorUserId, action: 'CANDIDATURA_AVALIADA', entity: 'Candidatura', entityId: id });
    return updated;
  }

  async rejeitar(id: string, dto: RejeitarDto, actorUserId: string) {
    await this.findOne(id);
    const updated = await this.prisma.candidatura.update({
      where: { id },
      data: { estado: 'REJEITADA', motivoRejeicao: dto.motivoRejeicao },
    });
    await this.audit.log({ userId: actorUserId, action: 'CANDIDATURA_REJEITADA', entity: 'Candidatura', entityId: id });
    return updated;
  }

  async aprovarFinal(id: string, dto: AprovarFinalCandidaturaDto, actorUserId: string) {
    const candidatura = await this.findOne(id);
    if (candidatura.funcionarioId) throw new ConflictException('Candidatura já resultou em contratação');
    const email = dto.email || candidatura.email;
    if (!email) throw new ConflictException('Candidatura não tem email — informe um email para criar o acesso do funcionário');

    const [firstName, ...rest] = candidatura.nomeCandidato.trim().split(/\s+/);
    const lastName = rest.join(' ') || firstName;

    const funcionario = await this.funcionariosService.create(
      {
        email,
        password: dto.password,
        firstName,
        lastName,
        phone: candidatura.telefone || undefined,
        cargo: candidatura.vaga.cargo,
        departamento: candidatura.vaga.departamento,
        dataAdmissao: dto.dataInicio,
        salarioBase: dto.salarioBase,
        unidadeId: candidatura.vaga.unidadeId || undefined,
      } as any,
      actorUserId,
    );

    await this.prisma.contrato.create({
      data: {
        funcionarioId: funcionario.id,
        tipo: dto.tipoContrato,
        cargo: candidatura.vaga.cargo,
        salarioBase: dto.salarioBase,
        dataInicio: new Date(dto.dataInicio),
        estado: 'RASCUNHO',
        elaboradoPorId: actorUserId,
      },
    });

    const updated = await this.prisma.candidatura.update({
      where: { id },
      data: {
        estado: 'CONTRATADA',
        funcionarioId: funcionario.id,
        aprovadoPorId: actorUserId,
        aprovadoEm: new Date(),
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CANDIDATURA_APROVADA_FINAL',
      entity: 'Candidatura',
      entityId: id,
      newValues: { funcionarioId: funcionario.id },
    });

    return updated;
  }
}
