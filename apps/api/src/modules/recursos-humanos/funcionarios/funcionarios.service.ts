import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { ConfigurarPermissoesDto } from './dto/configurar-permissoes.dto';

@Injectable()
export class FuncionariosService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private static readonly CLEARED_FOR_SALARIO = ['GESTOR_RH', 'SUPER_ADMIN', 'ADMIN'];

  private maskSalario<T extends { salarioBase?: any; contratos?: { salarioBase?: any }[] }>(
    funcionario: T,
    requesterRole?: string,
  ): T {
    if (requesterRole && FuncionariosService.CLEARED_FOR_SALARIO.includes(requesterRole)) {
      return funcionario;
    }
    const { salarioBase, ...rest } = funcionario as any;
    return {
      ...rest,
      contratos: funcionario.contratos?.map(({ salarioBase: _s, ...c }: any) => c),
    };
  }

  private async gerarNumeroFuncionario() {
    const year = new Date().getFullYear();
    const count = await this.prisma.funcionario.count({
      where: { numeroFuncionario: { startsWith: `FUNC-${year}-` } },
    });
    return `FUNC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: any, requesterRole?: string) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const where: any = {};
    if (query.cargo) where.cargo = query.cargo;
    if (query.estado) where.estado = query.estado;
    if (query.unidadeId) where.unidadeId = query.unidadeId;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } },
        { numeroFuncionario: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.funcionario.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { firstName: 'asc' },
        include: {
          user: { select: { email: true, role: true, isActive: true } },
          unidade: { select: { id: true, nome: true } },
        },
      }),
      this.prisma.funcionario.count({ where }),
    ]);

    return {
      data: data.map((f) => this.maskSalario(f, requesterRole)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, requesterRole?: string) {
    const funcionario = await this.prisma.funcionario.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, role: true, isActive: true } },
        instructor: { select: { id: true, isActive: true } },
        unidade: { select: { id: true, nome: true } },
        contratos: { orderBy: { createdAt: 'desc' } },
        certificacoes: { orderBy: { dataValidade: 'asc' } },
        escalas: { where: { data: { gte: new Date() } }, orderBy: { data: 'asc' }, take: 20 },
        avaliacoesDesempenho: { orderBy: { createdAt: 'desc' }, take: 10 },
        feriasFaltas: { orderBy: { createdAt: 'desc' }, take: 10 },
        ocorrenciasDisciplinares: { orderBy: { createdAt: 'desc' }, take: 10 },
        documentos: { orderBy: { uploadedAt: 'desc' } },
      },
    });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado');
    return this.maskSalario(funcionario, requesterRole);
  }

  async create(dto: CreateFuncionarioDto, actorUserId: string) {
    const bcrypt = await import('bcryptjs');
    const password = await bcrypt.hash(dto.password || Math.random().toString(36).slice(-10), 10);
    const numeroFuncionario = await this.gerarNumeroFuncionario();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password,
        role: 'VISITOR',
        funcionario: {
          create: {
            numeroFuncionario,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            biNumero: dto.biNumero,
            cargo: dto.cargo,
            departamento: dto.departamento || 'OPERACOES',
            dataAdmissao: dto.dataAdmissao ? new Date(dto.dataAdmissao) : undefined,
            contactoEmergencia: dto.contactoEmergencia,
            telefoneEmergencia: dto.telefoneEmergencia,
            salarioBase: dto.salarioBase,
            unidadeId: dto.unidadeId,
            estado: 'EM_ADMISSAO',
          },
        },
      },
      include: { funcionario: true },
    });

    if (dto.cargo === 'INSTRUTOR_NATACAO') {
      const instructor = await this.prisma.instructor.create({
        data: {
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          hireDate: dto.dataAdmissao ? new Date(dto.dataAdmissao) : new Date(),
          specializations: '[]',
        },
      });
      await this.prisma.funcionario.update({
        where: { id: user.funcionario!.id },
        data: { instructorId: instructor.id },
      });
      if (dto.unidadeId) {
        await this.prisma.instructorUnidade.create({
          data: { instrutorId: instructor.id, unidadeId: dto.unidadeId, isPrimary: true },
        });
      }
    }

    await this.audit.log({ userId: actorUserId, action: 'FUNCIONARIO_CRIADO', entity: 'Funcionario', entityId: user.funcionario!.id });
    return this.findOne(user.funcionario!.id);
  }

  async update(id: string, dto: UpdateFuncionarioDto) {
    await this.findOne(id);
    return this.prisma.funcionario.update({
      where: { id },
      data: { ...dto, dataAdmissao: dto.dataAdmissao ? new Date(dto.dataAdmissao) : undefined } as any,
    });
  }

  async configurarPermissoes(id: string, dto: ConfigurarPermissoesDto, actorUserId: string, actorRole?: string) {
    if (dto.role === 'SUPER_ADMIN' && actorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Apenas o Super Admin pode atribuir o papel de Super Admin');
    }
    const funcionario = await this.findOne(id);

    if (dto.email) {
      const exists = await this.prisma.user.findFirst({ where: { email: dto.email, NOT: { id: funcionario.userId } } });
      if (exists) throw new BadRequestException('Este email já está em uso');
    }

    await this.prisma.user.update({
      where: { id: funcionario.userId },
      data: { role: dto.role, ...(dto.email ? { email: dto.email } : {}) },
    });
    await this.audit.log({
      userId: actorUserId,
      action: 'FUNCIONARIO_PERMISSOES_CONFIGURADAS',
      entity: 'Funcionario',
      entityId: id,
      newValues: { role: dto.role, email: dto.email },
    });
    return this.findOne(id);
  }

  async toggleEstado(id: string, estado: string, actorUserId: string) {
    const funcionario = await this.findOne(id);
    if (funcionario.estado === 'DESLIGADO') {
      throw new ConflictException('Funcionário desligado — use o processo de desligamento para reverter');
    }
    await this.audit.log({ userId: actorUserId, action: 'FUNCIONARIO_ESTADO_ALTERADO', entity: 'Funcionario', entityId: id, oldValues: { estado: funcionario.estado }, newValues: { estado } });
    return this.prisma.funcionario.update({ where: { id }, data: { estado } });
  }
}
