import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { UpdateStudentFaseDto } from './dto/update-student-fase.dto';
import { avaliarRegraConclusao } from './regra-conclusao.util';

const ESCALA_OFICIAL = JSON.stringify(['1 - Péssimo', '2 - Fraco', '3 - Razoável', '4 - Bom', '5 - Excelente']);

function habilidades(items: Array<[string, boolean]>) {
  return JSON.stringify(items.map(([nome, obrigatoria]) => ({ nome, obrigatoria })));
}

const FASES_DEFAULT = [
  {
    nivel: 'AMA', ordem: 1, nome: 'Estrela-do-Mar', animal: 'estrela-do-mar', certificacao: 'BRONZE',
    descricao: 'Conforto no meio aquático, respiração ventral e primeiros alinhamentos',
    foco: 'Desenvolver conforto no meio aquático, controlar a respiração ventral e realizar primeiros deslizes alinhados com apoio',
    escala: ESCALA_OFICIAL,
    criterios: habilidades([
      ['Respiração ventral', true],
      ['Flutuação ventral e dorsal com apoio', true],
      ['Deslizes curtos', false],
      ['Confiança no meio aquático', false],
      ['Imersão total do corpo', false],
    ]),
    totalMinimo: 15,
    assiduidade: 80,
  },
  {
    nivel: 'AMA', ordem: 2, nome: 'Cavalo-Marinho', animal: 'cavalo-marinho', certificacao: 'BRONZE',
    descricao: 'Flutuação autónoma e alinhamento dorsal/ventral',
    foco: 'Desenvolver flutuação autónoma nas posições ventral, dorsal e vertical, e realizar transições com apoio reduzido',
    escala: ESCALA_OFICIAL,
    criterios: habilidades([
      ['Respiração ventral controlada', true],
      ['Flutuação ventral', false],
      ['Flutuação dorsal e vertical', true],
      ['Deslizes ventral/dorsal', false],
      ['Transições com apoio reduzido', false],
    ]),
    totalMinimo: 19,
    assiduidade: 80,
  },
  {
    nivel: 'AMA', ordem: 3, nome: 'Polvo', animal: 'polvo', certificacao: 'BRONZE',
    descricao: 'Controlo respiratório, autonomia e transições sem apoio',
    foco: 'Respiração ventral autónoma, flutuação independente nas 3 posições e transições sem apoio; conhecer regras básicas de segurança',
    escala: ESCALA_OFICIAL,
    criterios: habilidades([
      ['Respiração autónoma', true],
      ['Flutuação independente', true],
      ['Deslizes com mudança ventral ↔ dorsal sem apoio', false],
    ]),
    totalMinimo: 13,
    assiduidade: 80,
  },
  {
    nivel: 'INTERMEDIARIO', ordem: 4, nome: 'Tartaruga', animal: 'tartaruga', certificacao: 'PRATA',
    descricao: 'Consciência corporal e deslocamento alinhado',
    foco: 'Desenvolver consciência espacial, executar deslocamento hidrodinâmico ventral e dorsal, e introduzir respiração lateral',
    escala: ESCALA_OFICIAL,
    criterios: habilidades([
      ['Respiração ventral e lateral', true],
      ['Sculling – sustentação', false],
      ['Deslocamento alinhado', true],
      ['Pernada alternada', false],
    ]),
    totalMinimo: 15,
    assiduidade: 85,
  },
  {
    nivel: 'INTERMEDIARIO', ordem: 5, nome: 'Dugongo', animal: 'dugongo', certificacao: 'PRATA',
    descricao: 'Sustentação, propulsão e direção com sculling',
    foco: 'Respiração lateral coordenada, sculling para sustentação e propulsão, deslocamento lateral e introdução às pernadas simétricas',
    escala: ESCALA_OFICIAL,
    criterios: habilidades([
      ['Respiração coordenada', true],
      ['Sculling – sustentação/propulsão', false],
      ['Deslocamento multidirecional', true],
      ['Pernadas simétricas', false],
    ]),
    totalMinimo: 15,
    assiduidade: 85,
  },
  {
    nivel: 'INTERMEDIARIO', ordem: 6, nome: 'Crocodilo', animal: 'crocodilo', certificacao: 'PRATA',
    descricao: 'Controlo direcional e eficiência corporal',
    foco: 'Controlar o eixo corporal, deslocar-se em qualquer posição e direção, e alternar pernadas alternadas e simétricas com resistência crescente',
    escala: ESCALA_OFICIAL,
    criterios: habilidades([
      ['Deslocamento em várias direções', true],
      ['Pernadas alternadas e simétricas com resistência', false],
    ]),
    totalMinimo: 7,
    assiduidade: 85,
  },
  {
    nivel: 'AVANCADO', ordem: 7, nome: 'Tubarão', animal: 'tubarao', certificacao: 'OURO',
    descricao: 'Fundamentos técnicos de nado',
    foco: 'Desenvolver fundamentos das técnicas de nado: posição corporal hidrodinâmica, propulsão eficiente de pernas e introdução à propulsão de braços',
    escala: ESCALA_OFICIAL,
    criterios: habilidades([
      ['Propulsão de pernas', true],
      ['Introdução braços', false],
      ['Coordenação básica', false],
    ]),
    totalMinimo: 13,
    assiduidade: 90,
  },
  {
    nivel: 'AVANCADO', ordem: 8, nome: 'Marlim', animal: 'marlim', certificacao: 'OURO',
    descricao: 'Coordenação técnica consolidada',
    foco: 'Propulsão técnica consolidada, coordenação completa dos estilos e aplicação técnica em séries combinadas com respiração integrada',
    escala: ESCALA_OFICIAL,
    criterios: habilidades([
      ['Propulsão consolidada', true],
      ['Coordenação completa', false],
      ['Séries combinadas', false],
    ]),
    totalMinimo: 7,
    assiduidade: 90,
  },
  {
    nivel: 'AVANCADO', ordem: 9, nome: 'Golfinho', animal: 'golfinho', certificacao: 'OURO',
    descricao: 'Eficiência máxima e resistência',
    foco: 'Eficiência máxima de propulsão, alinhamento corporal em fadiga e aplicação técnica com resistência prolongada em todos os estilos',
    escala: ESCALA_OFICIAL,
    criterios: habilidades([
      ['Eficiência máxima', true],
      ['Alinhamento em fadiga', true],
      ['Resistência prolongada', true],
    ]),
    totalMinimo: 12,
    assiduidade: 92,
  },
];

@Injectable()
export class FasesService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  /**
   * Põe o módulo indicado em progresso para o atleta. O atleta só pode ter um módulo
   * em progresso: os outros voltam a NAO_INICIADO (as pontuações já dadas ficam guardadas).
   * Um módulo já concluído não é reaberto.
   */
  async atribuirModuloTx(tx: Prisma.TransactionClient, studentId: string, faseId: string) {
    const actual = await tx.studentFase.findUnique({ where: { studentId_faseId: { studentId, faseId } } });
    if (actual?.estado === 'CONCLUIDO') return { estado: 'JA_CONCLUIDO' as const };
    await tx.studentFase.updateMany({
      where: { studentId, estado: 'EM_PROGRESSO', NOT: { faseId } },
      data: { estado: 'NAO_INICIADO' },
    });
    if (actual?.estado === 'EM_PROGRESSO') return { estado: 'SEM_ALTERACAO' as const };
    await tx.studentFase.upsert({
      where: { studentId_faseId: { studentId, faseId } },
      update: { estado: 'EM_PROGRESSO', iniciadoEm: actual?.iniciadoEm ?? new Date() },
      create: { studentId, faseId, estado: 'EM_PROGRESSO', iniciadoEm: new Date() },
    });
    return { estado: 'ATRIBUIDO' as const };
  }

  /** Atribui um módulo a vários atletas (máx. 200). Devolve o resultado por atleta. */
  async atribuirModulo(studentIds: string[], faseId: string, actorUserId: string) {
    const fase = await this.prisma.faseProgressao.findUnique({ where: { id: faseId }, select: { id: true, nome: true, isActive: true } });
    if (!fase || !fase.isActive) throw new NotFoundException('Módulo não encontrado');
    const ids = [...new Set(studentIds)];
    const atletas = await this.prisma.student.findMany({ where: { id: { in: ids } }, select: { id: true, firstName: true, lastName: true } });
    const nomes = new Map(atletas.map((a) => [a.id, `${a.firstName} ${a.lastName}`.trim()]));

    const resultados: { studentId: string; nome: string; estado: string }[] = [];
    await this.prisma.$transaction(async (tx) => {
      for (const id of ids) {
        if (!nomes.has(id)) { resultados.push({ studentId: id, nome: '', estado: 'NAO_ENCONTRADO' }); continue; }
        const r = await this.atribuirModuloTx(tx, id, faseId);
        resultados.push({ studentId: id, nome: nomes.get(id)!, estado: r.estado });
      }
    }, { timeout: 30_000 });

    const atribuidos = resultados.filter((r) => r.estado === 'ATRIBUIDO').map((r) => r.studentId);
    await this.audit.log({
      userId: actorUserId, action: 'MODULO_ATRIBUIDO', entity: 'FaseProgressao', entityId: faseId,
      newValues: { modulo: fase.nome, studentIds: atribuidos },
    });
    return { modulo: fase.nome, atribuidos: atribuidos.length, resultados };
  }

  async findAll() {
    const fases = await this.prisma.faseProgressao.findMany({ where: { isActive: true }, orderBy: { ordem: 'asc' } });
    if (fases.length === 0) return this.seed();
    return fases;
  }

  async seed() {
    for (const f of FASES_DEFAULT) {
      await this.prisma.faseProgressao.upsert({
        where: { nivel_ordem: { nivel: f.nivel, ordem: f.ordem } },
        update: {
          nome: f.nome,
          animal: f.animal,
          certificacao: f.certificacao,
          descricao: f.descricao,
          foco: f.foco,
          escala: f.escala,
          criterios: f.criterios,
          totalMinimo: f.totalMinimo,
          assiduidade: f.assiduidade,
        },
        create: f,
      });
    }
    return this.prisma.faseProgressao.findMany({ orderBy: { ordem: 'asc' } });
  }

  async findOne(id: string) {
    const f = await this.prisma.faseProgressao.findUnique({ where: { id }, include: { studentFases: { include: { student: true } }, certificados: true } });
    if (!f) throw new NotFoundException('Fase não encontrada');
    return f;
  }

  async progressoAtleta(studentId: string) {
    const fases = await this.findAll();
    const progresso = await this.prisma.studentFase.findMany({ where: { studentId }, include: { fase: true, avaliacoes: true } });
    return fases.map(f => {
      const p = progresso.find(p => p.faseId === f.id);
      return { ...f, progresso: p || { estado: 'NAO_INICIADO' } };
    });
  }

  private validarConclusao(fase: { criterios: string; totalMinimo: number }, avaliacoes: Array<{ criterioIndex: number; valor: number }>) {
    const criterios: { nome: string; obrigatoria: boolean }[] = JSON.parse(fase.criterios);
    const resultado = avaliarRegraConclusao(criterios, fase.totalMinimo, avaliacoes);

    if (resultado.criteriosFaltando.length > 0) {
      throw new BadRequestException(`Faltam pontuações para: ${resultado.criteriosFaltando.join(', ')}`);
    }

    if (resultado.criteriosAbaixoMinimo.length > 0) {
      throw new BadRequestException(
        `Habilidades abaixo do mínimo exigido: ${resultado.criteriosAbaixoMinimo.map(({ nome, valor, minimo }) => `${nome} (${valor}, mín. ${minimo})`).join(', ')}`,
      );
    }

    if (resultado.soma < fase.totalMinimo) {
      throw new BadRequestException(`Pontuação total (${resultado.soma}) abaixo do mínimo exigido (${fase.totalMinimo})`);
    }
  }

  async updateProgresso(studentId: string, faseId: string, dto: UpdateStudentFaseDto) {
    const fase = await this.prisma.faseProgressao.findUnique({ where: { id: faseId } });
    if (!fase) throw new NotFoundException('Módulo não encontrado');

    const criterios: unknown[] = JSON.parse(fase.criterios);
    for (const av of dto.avaliacoes ?? []) {
      if (av.index < 0 || av.index >= criterios.length) {
        throw new BadRequestException(`Índice de habilidade inválido: ${av.index}`);
      }
    }

    const studentFase = await this.prisma.studentFase.upsert({
      where: { studentId_faseId: { studentId, faseId } },
      update: {},
      create: { studentId, faseId },
    });

    if (dto.avaliacoes?.length) {
      await this.prisma.$transaction(
        dto.avaliacoes.map(av =>
          this.prisma.studentFaseCriterio.upsert({
            where: { studentFaseId_criterioIndex: { studentFaseId: studentFase.id, criterioIndex: av.index } },
            update: { valor: av.valor, observacao: av.observacao },
            create: { studentFaseId: studentFase.id, criterioIndex: av.index, valor: av.valor, observacao: av.observacao },
          }),
        ),
      );
    }

    if (dto.estado === 'CONCLUIDO') {
      const avaliacoes = await this.prisma.studentFaseCriterio.findMany({ where: { studentFaseId: studentFase.id } });
      this.validarConclusao(fase, avaliacoes);
    }

    const { avaliacoes: _avaliacoes, iniciadoEm, concluidoEm, ...rest } = dto;
    // Só um módulo em progresso por atleta: ao pôr este em progresso, os outros voltam a NAO_INICIADO.
    if (dto.estado === 'EM_PROGRESSO') {
      await this.prisma.studentFase.updateMany({
        where: { studentId, estado: 'EM_PROGRESSO', NOT: { faseId } },
        data: { estado: 'NAO_INICIADO' },
      });
    }
    return this.prisma.studentFase.update({
      where: { id: studentFase.id },
      data: {
        ...rest,
        ...(iniciadoEm !== undefined && { iniciadoEm: new Date(iniciadoEm) }),
        ...(concluidoEm !== undefined && { concluidoEm: new Date(concluidoEm) }),
      },
      include: { avaliacoes: true },
    });
  }

  async getAlunosPorNivel(nivel: string) {
    const fases = await this.prisma.faseProgressao.findMany({
      where: { nivel, isActive: true },
      orderBy: { ordem: 'asc' },
      include: {
        studentFases: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, dateOfBirth: true, avatarUrl: true },
            },
            avaliacoes: true,
          },
          orderBy: [{ estado: 'asc' }, { updatedAt: 'desc' }],
        },
      },
    });
    return fases;
  }
}
