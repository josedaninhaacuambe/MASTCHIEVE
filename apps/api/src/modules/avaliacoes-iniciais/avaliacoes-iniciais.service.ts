import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { FasesService } from '../fases/fases.service';
import { AvaliacaoInicialBaseDto, CreateAvaliacaoInicialDto, UpdateAvaliacaoInicialDto } from './dto/avaliacao-inicial.dto';

type Actor = { id: string; role: string };

@Injectable()
export class AvaliacoesIniciaisService {
  constructor(private prisma: PrismaService, private fases: FasesService, private audit: AuditService) {}

  findAll(query: any = {}) {
    const where: any = {};
    if (typeof query.instrutorId === 'string' && query.instrutorId) where.instrutorId = query.instrutorId;
    return this.prisma.avaliacaoInicial.findMany({
      where, orderBy: { data: 'desc' },
      include: { student: { select: { firstName: true, lastName: true } }, instrutor: { select: { firstName: true, lastName: true } }, faseRecomendada: true },
    });
  }

  async findOne(id: string) {
    const a = await this.prisma.avaliacaoInicial.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, dateOfBirth: true, gender: true } },
        instrutor: { select: { id: true, firstName: true, lastName: true } },
        faseRecomendada: true,
      },
    });
    if (!a) throw new NotFoundException('Avaliação não encontrada');
    return a;
  }

  findByStudent(studentId: string) {
    return this.prisma.avaliacaoInicial.findUnique({
      where: { studentId },
      include: { faseRecomendada: true, instrutor: { select: { firstName: true, lastName: true } } },
    });
  }

  /** O instrutor regista em seu nome; a administração indica o instrutor que avaliou. */
  private async resolverInstrutor(actor: Actor, instrutorId?: string): Promise<string> {
    const proprio = await this.prisma.instructor.findUnique({ where: { userId: actor.id }, select: { id: true } });
    if (actor.role === 'INSTRUCTOR') {
      if (!proprio) throw new BadRequestException('A sua conta não tem perfil de instrutor.');
      return proprio.id;
    }
    if (instrutorId) {
      const i = await this.prisma.instructor.findUnique({ where: { id: instrutorId }, select: { id: true } });
      if (!i) throw new BadRequestException('Instrutor não encontrado.');
      return i.id;
    }
    if (proprio) return proprio.id;
    throw new BadRequestException('Indique o instrutor que fez a avaliação.');
  }

  private dados(dto: AvaliacaoInicialBaseDto) {
    const d: Record<string, any> = {};
    for (const k of ['experienciaAquatica', 'segurancaAdaptacao', 'confortoAgua', 'resistenciaBasica', 'criteriosAvaliados', 'necessidadesEspeciais', 'observacoes', 'faseRecomendadaId'] as const) {
      if (dto[k] !== undefined) d[k] = dto[k];
    }
    if (dto.data) d.data = new Date(dto.data);
    return d;
  }

  private async validarModulo(faseId?: string) {
    if (!faseId) return;
    const f = await this.prisma.faseProgressao.findUnique({ where: { id: faseId }, select: { isActive: true } });
    if (!f || !f.isActive) throw new BadRequestException('Módulo recomendado inválido.');
  }

  /**
   * Regista a ficha diagnóstica. Se o atleta já tiver uma, é actualizada (uma ficha por atleta).
   * O módulo recomendado passa a ser o módulo em progresso do atleta.
   */
  async create(dto: CreateAvaliacaoInicialDto, actor: Actor) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId }, select: { id: true } });
    if (!student) throw new NotFoundException('Atleta não encontrado');
    await this.validarModulo(dto.faseRecomendadaId);
    const instrutorId = await this.resolverInstrutor(actor, dto.instrutorId);
    const dados = this.dados(dto);
    if (!dados.criteriosAvaliados) dados.criteriosAvaliados = '[]';

    const { avaliacao, modulo, jaExistia } = await this.prisma.$transaction(async (tx) => {
      const existente = await tx.avaliacaoInicial.findUnique({ where: { studentId: dto.studentId }, select: { id: true } });
      const avaliacao = existente
        ? await tx.avaliacaoInicial.update({ where: { id: existente.id }, data: { ...dados, instrutorId, aprovadoPorId: null, aprovadoEm: null } })
        : await tx.avaliacaoInicial.create({ data: { ...dados, studentId: dto.studentId, instrutorId } as any });
      const modulo = dto.faseRecomendadaId ? await this.fases.atribuirModuloTx(tx, dto.studentId, dto.faseRecomendadaId) : null;
      return { avaliacao, modulo, jaExistia: !!existente };
    });

    await this.audit.log({
      userId: actor.id, action: jaExistia ? 'AVALIACAO_INICIAL_ACTUALIZADA' : 'AVALIACAO_INICIAL_CRIADA',
      entity: 'AvaliacaoInicial', entityId: avaliacao.id,
      newValues: { studentId: dto.studentId, faseRecomendadaId: dto.faseRecomendadaId ?? null, modulo: modulo?.estado ?? null },
    });
    return { ...avaliacao, moduloAtribuido: modulo?.estado ?? null, substituiuAnterior: jaExistia };
  }

  async update(id: string, dto: UpdateAvaliacaoInicialDto, actor: Actor) {
    const antes = await this.findOne(id);
    await this.validarModulo(dto.faseRecomendadaId);
    const dados = this.dados(dto);
    const avaliacao = await this.prisma.$transaction(async (tx) => {
      const a = await tx.avaliacaoInicial.update({ where: { id }, data: dados });
      if (dto.faseRecomendadaId && dto.faseRecomendadaId !== antes.faseRecomendadaId) {
        await this.fases.atribuirModuloTx(tx, antes.studentId, dto.faseRecomendadaId);
      }
      return a;
    });
    await this.audit.log({ userId: actor.id, action: 'AVALIACAO_INICIAL_ACTUALIZADA', entity: 'AvaliacaoInicial', entityId: id, newValues: dados });
    return avaliacao;
  }

  async aprovar(id: string, actor: Actor) {
    await this.findOne(id);
    const avaliacao = await this.prisma.$transaction(async (tx) => {
      const a = await tx.avaliacaoInicial.update({
        where: { id },
        data: { aprovadoPorId: actor.id, aprovadoEm: new Date() },
        include: { faseRecomendada: true },
      });
      if (a.faseRecomendadaId) await this.fases.atribuirModuloTx(tx, a.studentId, a.faseRecomendadaId);
      return a;
    });

    if (avaliacao.faseRecomendada) {
      let criterios: { nome: string; obrigatoria: boolean }[] = [];
      try { criterios = JSON.parse(avaliacao.faseRecomendada.criterios); } catch { /* critérios inválidos: plano sem itens */ }
      await this.prisma.trainingPlan.create({
        data: {
          studentId: avaliacao.studentId,
          instructorId: avaliacao.instrutorId,
          title: 'Road Map Inicial',
          description: `Plano gerado automaticamente após aprovação da avaliação de diagnóstico — módulo recomendado: ${avaliacao.faseRecomendada.nome}`,
          objectives: JSON.stringify(criterios.filter((c) => c.obrigatoria).map((c) => c.nome)),
          exercises: JSON.stringify(criterios.map((c) => c.nome)),
          aiGenerated: false,
          validFrom: new Date(),
        },
      });
    }
    await this.audit.log({ userId: actor.id, action: 'AVALIACAO_INICIAL_APROVADA', entity: 'AvaliacaoInicial', entityId: id });
    return avaliacao;
  }
}
