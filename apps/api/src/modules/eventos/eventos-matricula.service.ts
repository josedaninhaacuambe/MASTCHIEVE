import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { StudentsService } from '../students/students.service';
import { FinancialService } from '../financial/financial.service';
import { MatricularUnidadeDto } from './dto/eventos.dto';

export type ResultadoMatricula = {
  participanteId: string;
  nome: string;
  ok: boolean;
  motivo?: string;
  studentId?: string;
  recibo?: string | null;
};

/** Divide "Nome Apelido Apelido" em nome + apelidos, sem inventar o que falta. */
export function dividirNome(completo: string): { firstName: string; lastName: string } {
  const partes = completo.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return { firstName: '', lastName: '' };
  if (partes.length === 1) return { firstName: partes[0], lastName: '' };
  return { firstName: partes[0], lastName: partes.slice(1).join(' ') };
}

/**
 * Passa participantes de um evento para atletas regulares de uma unidade.
 * Só depois de o staff confirmar que a pessoa concordou e que pagou; usa as mesmas
 * regras da ficha de atleta (unidade da secretaria, pacote activo, 1.ª mensalidade)
 * e regista o pagamento com recibo. Não cria contactos que o participante não deu.
 */
@Injectable()
export class EventosMatriculaService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private students: StudentsService,
    private financial: FinancialService,
  ) {}

  async matricular(eventoId: string, dto: MatricularUnidadeDto, actor: { id: string; role: string }) {
    if (!dto.consentimento) throw new BadRequestException('Confirme que os participantes concordaram com a inscrição na unidade.');
    if (!dto.pagamentoRecebido) throw new BadRequestException('A inscrição na unidade só é feita depois de o pagamento ser recebido.');
    if ((actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN') && !dto.unidadeId) {
      throw new BadRequestException('Escolha a unidade onde os atletas vão ficar inscritos.');
    }
    const evento = await this.prisma.evento.findUnique({ where: { id: eventoId }, select: { id: true, nome: true } });
    if (!evento) throw new NotFoundException('Evento não encontrado');

    const ids = Array.from(new Set(dto.participanteIds));
    const participantes = await this.prisma.eventoParticipante.findMany({
      where: { id: { in: ids }, eventoId },
      select: {
        id: true, nome: true, contacto: true, estado: true, studentId: true, leadId: true,
        dataNascimento: true, dadosFormulario: true, autorizacaoImagem: true,
      },
    });

    const resultados: ResultadoMatricula[] = [];
    for (const id of ids) {
      const p = participantes.find((x) => x.id === id);
      if (!p) { resultados.push({ participanteId: id, nome: '', ok: false, motivo: 'Não pertence a este evento' }); continue; }
      resultados.push(await this.matricularUm(p, evento, dto, actor));
    }
    return {
      inscritos: resultados.filter((r) => r.ok).length,
      ignorados: resultados.filter((r) => !r.ok).length,
      resultados,
    };
  }

  private async matricularUm(
    p: {
      id: string; nome: string | null; contacto: string | null; estado: string; studentId: string | null; leadId: string | null;
      dataNascimento: Date | null; dadosFormulario: string | null; autorizacaoImagem: boolean | null;
    },
    evento: { id: string; nome: string },
    dto: MatricularUnidadeDto,
    actor: { id: string; role: string },
  ): Promise<ResultadoMatricula> {
    const nome = (p.nome ?? '').trim();
    const base = { participanteId: p.id, nome };
    if (p.studentId) return { ...base, ok: false, motivo: 'Já é atleta registado' };
    if (p.estado === 'CANCELADO') return { ...base, ok: false, motivo: 'Inscrição no evento cancelada' };
    if (!nome) return { ...base, ok: false, motivo: 'Sem nome — complete os dados na ficha do evento' };
    if (!p.dataNascimento) return { ...base, ok: false, motivo: 'Sem data de nascimento — inscreva pela ficha de atleta' };

    const { firstName, lastName } = dividirNome(nome);
    // Possível duplicado: mesmo nome e data de nascimento já registados.
    const duplicado = await this.prisma.student.findFirst({
      where: { firstName, lastName, dateOfBirth: p.dataNascimento },
      select: { id: true },
    });
    if (duplicado) return { ...base, ok: false, motivo: 'Já existe um atleta com o mesmo nome e data de nascimento' };

    let dados: any = {};
    try { dados = p.dadosFormulario ? JSON.parse(p.dadosFormulario) : {}; } catch { dados = {}; }
    const gender = dados.genero === 'F' ? 'FEMALE' : dados.genero === 'M' ? 'MALE' : 'OTHER';

    let criado: any;
    try {
      criado = await this.students.create({
        firstName, lastName,
        dateOfBirth: p.dataNascimento.toISOString(),
        gender,
        // Só o contacto que o participante deu; sem email inventado para comunicações.
        phone: p.contacto ?? undefined,
        emergencyPhone: p.contacto ?? undefined,
        autorizacaoImagem: p.autorizacaoImagem ?? false,
        unidadeId: dto.unidadeId,
        pacoteId: dto.pacoteId,
        classId: dto.classId,
        gerarPrimeiraMensalidade: true,
      }, actor.id, undefined, actor.role);
    } catch (e: any) {
      return { ...base, ok: false, motivo: e?.response?.message ?? e?.message ?? 'Erro ao criar o atleta' };
    }
    const studentId: string | undefined = criado?.student?.id ?? criado?.id;
    if (!studentId) return { ...base, ok: false, motivo: 'Erro ao criar o atleta' };

    await this.prisma.eventoParticipante.update({ where: { id: p.id }, data: { studentId } });
    if (p.leadId) {
      const jaLigado = await this.prisma.student.findFirst({ where: { leadId: p.leadId }, select: { id: true } });
      if (!jaLigado) await this.prisma.student.update({ where: { id: studentId }, data: { leadId: p.leadId } });
      await this.prisma.lead.update({ where: { id: p.leadId }, data: { estado: 'CONVERTIDO', dataConversao: new Date() } }).catch(() => undefined);
    }

    // Regista o pagamento da 1.ª mensalidade criada com o pacote (recibo pelas regras do Financeiro).
    let recibo: string | null = null;
    const pendente = await this.prisma.payment.findFirst({
      where: { studentId, status: 'PENDING', monthlyFeeId: { not: null } },
      orderBy: { createdAt: 'desc' }, select: { id: true },
    });
    if (pendente) {
      const pago = await this.financial.markAsPaid(pendente.id, dto.metodoPagamento, actor.id).catch(() => null);
      recibo = pago?.receiptNumber ?? null;
    }

    await this.audit.log({
      userId: actor.id, action: 'EVENTO_PARTICIPANTE_MATRICULADO', entity: 'EventoParticipante', entityId: p.id,
      newValues: {
        eventoId: evento.id, studentId, unidadeId: dto.unidadeId ?? null, pacoteId: dto.pacoteId,
        consentimentoConfirmadoPor: actor.id, pagamentoRecebido: true, metodo: dto.metodoPagamento, recibo,
      },
    });
    return { ...base, ok: true, studentId, recibo };
  }
}
