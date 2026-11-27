import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { resolveContactoAtleta } from '../../common/utils/contacto-atleta.util';
import {
  LinhaRelatorio, gerarExcelRelatorioDiario, idadeNaData, ordenarTurnos, parseDataRelatorio,
  tituloRelatorio, turnoDaAula, diaDaSemana, intervaloDiaMaputo, turnoDaEntrada,
} from './relatorio-diario.util';

const PRESENTE = ['PRESENT', 'LATE'];

const SELECT_ATLETA = {
  firstName: true, lastName: true, dateOfBirth: true, phone: true, emergencyPhone: true,
  etiqueta: true, trabalhadorBm: true,
  parents: { select: { isPrimary: true, parent: { select: { phone: true, firstName: true, lastName: true } } } },
  studentFases: { where: { estado: 'EM_PROGRESSO' }, select: { fase: { select: { nome: true, ordem: true } } } },
} as const;

@Injectable()
export class RelatorioDiarioService {
  constructor(private prisma: PrismaService) {}

  /** ADMIN / SUPER_ADMIN escolhem a unidade; o assistente vê sempre a sua. */
  private async unidadePermitida(pedida: string | undefined, user: { id: string; role: string }): Promise<string | null> {
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return pedida || null;
    const f = await this.prisma.funcionario.findUnique({ where: { userId: user.id }, select: { unidadeId: true } });
    if (!f?.unidadeId) throw new ForbiddenException('A sua conta não tem unidade atribuída — peça a um Admin para a configurar.');
    if (pedida && pedida !== f.unidadeId) throw new ForbiddenException('Só pode ver o relatório da sua unidade.');
    return f.unidadeId;
  }

  async gerar(dataStr: string, unidadeIdPedida: string | undefined, user: { id: string; role: string }) {
    const data = parseDataRelatorio(dataStr);
    if (!data) throw new BadRequestException('Indique a data no formato AAAA-MM-DD.');
    const unidadeId = await this.unidadePermitida(unidadeIdPedida, user);
    const fim = new Date(data);
    fim.setDate(fim.getDate() + 1);

    const dia = intervaloDiaMaputo(dataStr)!;
    const [presencas, registos, fases, unidade] = await Promise.all([
      this.prisma.attendance.findMany({
        where: {
          status: { in: PRESENTE },
          session: { sessionDate: { gte: data, lt: fim } },
          ...(unidadeId && { OR: [{ unidadeId }, { unidadeId: null, session: { class: { unidadeId } } }] }),
        },
        select: {
          studentId: true,
          session: { select: { startTime: true, endTime: true, class: { select: { name: true, moduleIds: true } } } },
          student: { select: SELECT_ATLETA },
        },
      }),
      // Registos de entrada e saída do dia: cada entrada não cancelada conta como presença.
      this.prisma.registoEntradaSaidaAluno.findMany({
        where: {
          dataHora: { gte: dia.inicio, lt: dia.fim },
          ...(unidadeId && { student: { unidadeId } }),
        },
        orderBy: { dataHora: 'asc' },
        select: { studentId: true, tipo: true, dataHora: true, student: { select: SELECT_ATLETA } },
      }),
      this.prisma.faseProgressao.findMany({ select: { id: true, nome: true } }),
      unidadeId ? this.prisma.unidade.findUnique({ where: { id: unidadeId }, select: { nome: true } }) : null,
    ]);

    const nomeFase = new Map(fases.map((f) => [f.id, f.nome]));
    const modulosDaTurma = (json: string | null): string => {
      if (!json) return '';
      try {
        const ids = JSON.parse(json);
        return Array.isArray(ids) ? ids.map((id) => nomeFase.get(id)).filter(Boolean).join(', ') : '';
      } catch { return ''; }
    };

    const porTurno = new Map<string, LinhaRelatorio[]>();
    const vistos = new Set<string>();
    const juntar = (turno: string, studentId: string, s: (typeof presencas)[number]['student'], moduloTurma: string) => {
      const chave = `${turno}|${studentId}`;
      if (vistos.has(chave)) return; // o mesmo atleta conta uma vez por turno
      vistos.add(chave);
      const emCurso = s.studentFases.map((sf) => sf.fase).sort((a, b) => b.ordem - a.ordem)[0];
      const linha: LinhaRelatorio = {
        nome: `${s.firstName} ${s.lastName}`.trim(),
        trabalhadorBm: s.trabalhadorBm || (s.etiqueta === 'BM' ? 'Sim' : ''),
        // Sem contacto registado, a célula fica vazia (não se inventa um número).
        contacto: resolveContactoAtleta(s).telefone ?? '',
        modulo: emCurso?.nome || moduloTurma,
        idade: s.dateOfBirth ? idadeNaData(new Date(s.dateOfBirth), data) : null,
      };
      if (!porTurno.has(turno)) porTurno.set(turno, []);
      porTurno.get(turno)!.push(linha);
    };

    // 1) Entradas registadas na recepção (excepto as canceladas logo a seguir).
    const atletasComEntrada = new Set<string>();
    registos.forEach((r, i) => {
      if (r.tipo !== 'ENTRADA') return;
      const fecho = registos.slice(i + 1).find((x) => x.studentId === r.studentId);
      if (fecho?.tipo === 'CANCELAMENTO') return;
      atletasComEntrada.add(r.studentId);
      juntar(turnoDaEntrada(r.dataHora), r.studentId, r.student, '');
    });

    // 2) Presenças marcadas nas aulas, para quem não tem entrada registada nesse dia.
    for (const p of presencas) {
      if (atletasComEntrada.has(p.studentId)) continue;
      juntar(turnoDaAula(p.session.startTime, p.session.endTime), p.studentId, p.student, modulosDaTurma(p.session.class.moduleIds));
    }

    const turnos = ordenarTurnos(porTurno);
    return {
      data: dataStr,
      diaSemana: diaDaSemana(data),
      unidade: unidade?.nome ?? null,
      titulo: tituloRelatorio(data),
      total: turnos.reduce((s, t) => s + t.atletas.length, 0),
      turnos,
    };
  }

  async exportar(dataStr: string, unidadeId: string | undefined, user: { id: string; role: string }) {
    const r = await this.gerar(dataStr, unidadeId, user);
    const buffer = gerarExcelRelatorioDiario({ titulo: r.titulo, data: parseDataRelatorio(dataStr)!, unidade: r.unidade, turnos: r.turnos });
    return { buffer, nomeFicheiro: `presencas-${dataStr}.xlsx` };
  }
}
