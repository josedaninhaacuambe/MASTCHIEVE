import {
  Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException, GoneException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { access, open, unlink } from 'fs/promises';
import { join } from 'path';
import { formatoPorAssinatura, MAX_IMAGENS_POR_EVENTO, NOME_IMAGEM_EVENTO } from './eventos-imagens.util';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { EmailService } from '../email/email.service';
import { resolveContactoAtleta } from '../../common/utils/contacto-atleta.util';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CanalEnvio, ESTADO_LABEL, EstadoParticipante, comporMensagem, eDuplicado, gerarCsv, isEstadoValido,
  lerConfigFormulario, normalizarEmail, normalizarTelefone, planearEnvios, presenteDoEstado, urlSegura,
  vagasDisponiveis, FORMULARIO_TIPOS, HORARIOS_ESCOLA_OMISSAO, diaLocal, idadeEm, periodosSobrepostos,
  validarInicioPrograma,
} from './eventos-formulario.util';
import {
  AlterarPacoteParticipanteDto, ComunicacaoEventoDto, ImagemEventoDto, InscricaoProgramaDto, PacoteEventoDto, PartilharComLeadsDto,
  PreInscricaoEscolaDto, PreInscricaoIndividualDto, RejeitarParticipanteDto, ValidarParticipanteDto, WalkInDto,
} from './dto/eventos.dto';

const IMAGEM_SELECT = { id: true, url: true, legenda: true, cartaz: true, ordem: true } as const;
const ORDEM_IMAGENS = [{ cartaz: 'desc' as const }, { ordem: 'asc' as const }, { createdAt: 'asc' as const }];

// Campos do evento que o staff pode gravar (evita mass-assignment).
const CAMPOS_EVENTO = [
  'tipo', 'nome', 'data', 'dataFim', 'unidadeId', 'programa', 'capacidade', 'estado', 'notas', 'checklistMateriais',
  'relatorioPos', 'descricao', 'hora', 'local', 'formularioTipo', 'formularioCampos', 'inscricoesAbertas',
  'linkInscricaoAtleta',
];
const MAX_DESTINATARIOS_POR_ENVIO = 500;

// Quem valida as inscrições do formulário público (SUPER_ADMIN passa sempre no RolesGuard).
const ROLES_VALIDACAO = ['ADMIN', 'ASSISTENTE_ADMIN'];

const AUTOR_SELECT = {
  id: true,
  admin: { select: { firstName: true, lastName: true } },
  instructor: { select: { firstName: true, lastName: true } },
  funcionario: { select: { firstName: true, lastName: true } },
} as const;

function nomeDoUtilizador(u: any): string | null {
  const p = u?.funcionario || u?.admin || u?.instructor;
  return p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || null : null;
}

const diaParaDate = (dia: string) => new Date(`${dia}T00:00:00.000Z`);
const dateParaDia = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);
const fmtDia = (dia: string | null) => (dia ? dia.split('-').reverse().join('/') : '');
const fmtMt = (v: number | null | undefined) =>
  v == null ? '' : `${v.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} MT`;

const appUrl = () => (process.env.APP_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:4300').replace(/\/$/, '');

@Injectable()
export class EventosService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private whatsapp: WhatsappService,
    private email: EmailService,
    private notifications: NotificationsService,
  ) {}

  // ─── Eventos ───────────────────────────────────────────────────────────────

  private gerarToken() {
    return randomBytes(16).toString('base64url');
  }

  urlPublica(token?: string | null) {
    return token ? `${appUrl()}/evento/${token}` : null;
  }

  private sanitizarEvento(body: any) {
    const data: any = {};
    for (const k of CAMPOS_EVENTO) if (body[k] !== undefined) data[k] = body[k];
    if (data.data) data.data = new Date(data.data);
    if (data.dataFim === '' || data.dataFim === null) data.dataFim = null;
    else if (data.dataFim !== undefined) {
      data.dataFim = new Date(data.dataFim);
      if (Number.isNaN(data.dataFim.getTime())) throw new BadRequestException('Data de fim inválida');
    }
    if (data.capacidade === '' || data.capacidade === null) data.capacidade = null;
    else if (data.capacidade !== undefined) {
      const n = Number(data.capacidade);
      if (!Number.isInteger(n) || n < 0) throw new BadRequestException('Capacidade inválida');
      data.capacidade = n;
    }
    if (data.unidadeId === '') data.unidadeId = null;
    if (data.formularioTipo !== undefined && !(FORMULARIO_TIPOS as readonly string[]).includes(data.formularioTipo)) {
      throw new BadRequestException('Tipo de formulário inválido (INDIVIDUAL, ESCOLA ou PROGRAMA)');
    }
    if (data.formularioCampos !== undefined && data.formularioCampos !== null && typeof data.formularioCampos !== 'string') {
      data.formularioCampos = JSON.stringify(data.formularioCampos);
    }
    if (data.checklistMateriais !== undefined && data.checklistMateriais !== null && typeof data.checklistMateriais !== 'string') {
      data.checklistMateriais = JSON.stringify(data.checklistMateriais);
    }
    if (data.linkInscricaoAtleta !== undefined) {
      if (data.linkInscricaoAtleta && !urlSegura(data.linkInscricaoAtleta)) {
        throw new BadRequestException('Link de inscrição inválido (use http/https)');
      }
      data.linkInscricaoAtleta = data.linkInscricaoAtleta || null;
    }
    if (data.inscricoesAbertas !== undefined) data.inscricoesAbertas = !!data.inscricoesAbertas;
    return data;
  }

  async findAll(query: any = {}) {
    const where: any = {};
    if (query.tipo) where.tipo = query.tipo;
    if (query.estado) where.estado = query.estado;
    if (query.unidadeId) where.unidadeId = query.unidadeId;
    const eventos = await this.prisma.evento.findMany({
      where, orderBy: { data: 'desc' },
      include: {
        unidade: { select: { nome: true, codigo: true } },
        _count: { select: { certificados: true, leads: true, participantes: true } },
        imagens: { select: IMAGEM_SELECT, orderBy: ORDEM_IMAGENS },
      },
    });
    const ids = eventos.map((e) => e.id);
    const contagens = await this.contarPreInscricoes(ids);
    const porValidar = ids.length
      ? await this.prisma.eventoParticipante.groupBy({
        by: ['eventoId'], where: { eventoId: { in: ids }, origem: 'PRE_INSCRICAO', estado: 'PRE_INSCRITO' }, _count: true,
      })
      : [];
    const mapaPorValidar = Object.fromEntries(porValidar.map((r) => [r.eventoId, r._count])) as Record<string, number>;
    return eventos.map((e) => ({
      ...e,
      preInscricoes: contagens[e.id] ?? 0,
      porValidar: mapaPorValidar[e.id] ?? 0,
      urlPublica: this.urlPublica(e.tokenPublico),
    }));
  }

  private async contarPreInscricoes(ids: string[]) {
    if (!ids.length) return {} as Record<string, number>;
    const rows = await this.prisma.eventoParticipante.groupBy({
      by: ['eventoId'], where: { eventoId: { in: ids }, origem: 'PRE_INSCRICAO' }, _count: true,
    });
    return Object.fromEntries(rows.map((r) => [r.eventoId, r._count])) as Record<string, number>;
  }

  async findOne(id: string) {
    const e = await this.prisma.evento.findUnique({
      where: { id },
      include: { unidade: true, certificados: { include: { student: true, fase: true } }, leads: true, participantes: true },
    });
    if (!e) throw new NotFoundException('Evento não encontrado');
    const porEstado = await this.prisma.eventoParticipante.groupBy({ by: ['estado'], where: { eventoId: id }, _count: true });
    const preInscricoes = await this.prisma.eventoParticipante.count({ where: { eventoId: id, origem: 'PRE_INSCRICAO' } });
    return {
      ...e,
      urlPublica: this.urlPublica(e.tokenPublico),
      linkInscricaoAtletaEfectivo: e.linkInscricaoAtleta || `${appUrl()}/register`,
      formularioConfig: lerConfigFormulario(e.formularioTipo, e.formularioCampos),
      resumo: {
        preInscricoes,
        porEstado: Object.fromEntries(porEstado.map((r) => [r.estado, r._count])),
      },
    };
  }

  async create(body: any, actorUserId?: string) {
    const data = this.sanitizarEvento(body);
    if (!data.nome || !data.data) throw new BadRequestException('Nome e data são obrigatórios');
    if (data.dataFim && data.dataFim < data.data) throw new BadRequestException('A data de fim não pode ser anterior à data de início');
    if (data.inscricoesAbertas) data.tokenPublico = this.gerarToken();
    const evento = await this.prisma.evento.create({ data });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId, action: 'EVENTO_CRIADO', entity: 'Evento', entityId: evento.id,
        newValues: { nome: evento.nome, tipo: evento.tipo, formularioTipo: evento.formularioTipo, inscricoesAbertas: evento.inscricoesAbertas },
      });
    }
    return { ...evento, urlPublica: this.urlPublica(evento.tokenPublico) };
  }

  async update(id: string, body: any, actorUserId?: string) {
    const existing = await this.prisma.evento.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Evento não encontrado');
    const data = this.sanitizarEvento(body);
    const inicio = data.data ?? existing.data;
    const fim = data.dataFim !== undefined ? data.dataFim : existing.dataFim;
    if (fim && inicio && fim < inicio) throw new BadRequestException('A data de fim não pode ser anterior à data de início');
    // Abrir o formulário gera o link público se ainda não existir. Fechar mantém o link e os dados.
    if (data.inscricoesAbertas && !existing.tokenPublico) data.tokenPublico = this.gerarToken();
    const updated = await this.prisma.evento.update({ where: { id }, data });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId, action: 'EVENTO_ATUALIZADO', entity: 'Evento', entityId: id,
        oldValues: { estado: existing.estado, inscricoesAbertas: existing.inscricoesAbertas, formularioTipo: existing.formularioTipo },
        newValues: { estado: updated.estado, inscricoesAbertas: updated.inscricoesAbertas, formularioTipo: updated.formularioTipo },
      });
    }
    return { ...updated, urlPublica: this.urlPublica(updated.tokenPublico) };
  }

  /**
   * Volta a pôr um evento cancelado (ou realizado por engano) como Planeado.
   * Mantém o mesmo link público, ou gera um novo (o antigo deixa de funcionar).
   * Participantes e inscrições existentes ficam como estavam.
   */
  async reactivar(id: string, opts: { novoLink?: boolean; abrirInscricoes?: boolean }, actorUserId: string) {
    const existing = await this.prisma.evento.findUnique({ where: { id }, select: { id: true, estado: true, tokenPublico: true, inscricoesAbertas: true } });
    if (!existing) throw new NotFoundException('Evento não encontrado');
    if (existing.estado === 'PLANEADO') throw new BadRequestException('O evento já está activo');
    const data: any = { estado: 'PLANEADO' };
    if (opts.abrirInscricoes) data.inscricoesAbertas = true;
    if (opts.novoLink || (!existing.tokenPublico && (opts.abrirInscricoes || existing.inscricoesAbertas))) data.tokenPublico = this.gerarToken();
    const updated = await this.prisma.evento.update({ where: { id }, data });
    await this.audit.log({
      userId: actorUserId, action: 'EVENTO_REACTIVADO', entity: 'Evento', entityId: id,
      oldValues: { estado: existing.estado, inscricoesAbertas: existing.inscricoesAbertas },
      newValues: { estado: updated.estado, inscricoesAbertas: updated.inscricoesAbertas, novoLink: !!data.tokenPublico },
    });
    return { ...updated, urlPublica: this.urlPublica(updated.tokenPublico) };
  }

  /** Invalida o link antigo (ex.: partilhado por engano) e gera um novo. */
  async regenerarLink(id: string, actorUserId: string) {
    const existing = await this.prisma.evento.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Evento não encontrado');
    const updated = await this.prisma.evento.update({ where: { id }, data: { tokenPublico: this.gerarToken() } });
    await this.audit.log({ userId: actorUserId, action: 'EVENTO_LINK_REGENERADO', entity: 'Evento', entityId: id });
    return { urlPublica: this.urlPublica(updated.tokenPublico) };
  }

  // ─── Participantes (staff) ─────────────────────────────────────────────────

  private nomeParticipante(p: { nome: string | null; student?: { firstName: string; lastName: string } | null }) {
    return p.nome || (p.student ? `${p.student.firstName} ${p.student.lastName}`.trim() : '');
  }

  async listParticipantes(eventoId: string, query: any = {}) {
    const ev = await this.prisma.evento.findUnique({ where: { id: eventoId }, select: { id: true } });
    if (!ev) throw new NotFoundException('Evento não encontrado');
    const where: any = { eventoId };
    if (query.estado && isEstadoValido(query.estado)) where.estado = query.estado;
    if (query.origem) where.origem = query.origem;
    const search = (query.search ?? '').trim();
    if (search) {
      where.OR = [
        { nome: { contains: search } },
        { contacto: { contains: search } },
        { email: { contains: search } },
        { student: { firstName: { contains: search } } },
        { student: { lastName: { contains: search } } },
        { inscricao: { responsavelNome: { contains: search } } },
      ];
    }
    const rows = await this.prisma.eventoParticipante.findMany({
      where,
      orderBy: [{ submetidoEm: 'desc' }, { createdAt: 'desc' }],
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        inscricao: { select: { id: true, tipo: true, responsavelNome: true, contacto: true, email: true, dados: true, submetidoEm: true } },
        lead: { select: { id: true, estado: true } },
      },
    });
    const validadoresIds = [...new Set(rows.map((p) => p.validadoPorId).filter((x): x is string => !!x))];
    const validadores = validadoresIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: validadoresIds } }, select: AUTOR_SELECT })
      : [];
    const nomeValidador = new Map(validadores.map((u) => [u.id, nomeDoUtilizador(u)]));
    return rows.map((p) => ({
      ...p,
      validadoPorNome: p.validadoPorId ? nomeValidador.get(p.validadoPorId) ?? null : null,
      nomeExibicao: this.nomeParticipante(p),
      dadosFormulario: this.parseJson(p.dadosFormulario),
      inscricao: p.inscricao ? { ...p.inscricao, dados: this.parseJson(p.inscricao.dados) } : null,
    }));
  }

  private parseJson(s?: string | null) {
    if (!s) return null;
    try { return JSON.parse(s); } catch { return null; }
  }

  async addParticipante(
    eventoId: string,
    body: { studentId?: string; nome?: string; contacto?: string; email?: string; pagamentoId?: string },
    actorUserId?: string,
  ) {
    const ev = await this.prisma.evento.findUnique({ where: { id: eventoId }, select: { id: true } });
    if (!ev) throw new NotFoundException('Evento não encontrado');
    const data = {
      studentId: body.studentId || undefined,
      nome: body.nome?.trim() || undefined,
      contacto: body.contacto?.trim() || undefined,
      email: normalizarEmail(body.email) ?? undefined,
      pagamentoId: body.pagamentoId || undefined,
    };
    if (!data.studentId && !data.nome) throw new BadRequestException('Indique um atleta ou o nome do participante');
    if (data.studentId) {
      const ja = await this.prisma.eventoParticipante.findFirst({
        where: { eventoId, studentId: data.studentId, estado: { not: 'CANCELADO' } }, select: { id: true },
      });
      if (ja) throw new ConflictException('Este atleta já consta da lista do evento');
    }
    const participante = await this.prisma.eventoParticipante.create({
      data: { eventoId, ...data, origem: 'MANUAL', estado: 'CONFIRMADO' },
    });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId, action: 'EVENTO_PARTICIPANTE_ADICIONADO', entity: 'EventoParticipante', entityId: participante.id,
        newValues: { eventoId, ...data },
      });
    }
    return participante;
  }

  /** Participante que apareceu no dia sem pré-inscrição. Nunca inventa contactos. */
  async addWalkIn(eventoId: string, dto: WalkInDto, actorUserId: string) {
    const ev = await this.prisma.evento.findUnique({ where: { id: eventoId }, select: { id: true } });
    if (!ev) throw new NotFoundException('Evento não encontrado');
    const existentes = await this.prisma.eventoParticipante.findMany({
      where: { eventoId }, select: { nome: true, contacto: true, email: true, estado: true },
    });
    if ((dto.contacto || dto.email) && eDuplicado({ nome: dto.nome, contacto: dto.contacto, email: dto.email }, existentes)) {
      throw new ConflictException('Este participante já consta da lista — altere o estado para Presente');
    }
    const participante = await this.prisma.eventoParticipante.create({
      data: {
        eventoId,
        nome: dto.nome,
        contacto: dto.contacto || null,
        email: normalizarEmail(dto.email),
        studentId: dto.studentId || null,
        origem: 'WALK_IN',
        estado: 'PRESENTE',
        presente: true,
        dadosFormulario: dto.notas ? JSON.stringify({ notas: dto.notas }) : null,
      },
    });
    await this.audit.log({
      userId: actorUserId, action: 'EVENTO_WALK_IN_REGISTADO', entity: 'EventoParticipante', entityId: participante.id,
      newValues: { eventoId, nome: dto.nome, temContacto: !!(dto.contacto || dto.email) },
    });
    return participante;
  }

  async alterarEstado(participanteId: string, estado: string, actorUserId: string) {
    if (!isEstadoValido(estado)) throw new BadRequestException('Estado inválido');
    const atual = await this.prisma.eventoParticipante.findUnique({ where: { id: participanteId } });
    if (!atual) throw new NotFoundException('Participante não encontrado');
    // Inscrições de programa (com pacote) só saem de "por validar" pela validação/rejeição,
    // que registam quem decidiu e só estão disponíveis para ADMIN/ASSISTENTE_ADMIN.
    if (atual.pacoteNome && atual.estado === 'PRE_INSCRITO' && (estado === 'CONFIRMADO' || estado === 'CANCELADO')) {
      throw new BadRequestException('Use "Validar" ou "Rejeitar" para decidir esta inscrição.');
    }
    const participante = await this.prisma.eventoParticipante.update({
      where: { id: participanteId },
      data: { estado, presente: presenteDoEstado(estado) },
    });
    await this.audit.log({
      userId: actorUserId, action: 'EVENTO_PARTICIPANTE_ESTADO', entity: 'EventoParticipante', entityId: participanteId,
      oldValues: { estado: atual.estado }, newValues: { estado },
    });
    return participante;
  }

  /** Compatibilidade com o toggle antigo de presença. */
  async marcarPresencaParticipante(participanteId: string, presente: boolean, actorUserId?: string) {
    const atual = await this.prisma.eventoParticipante.findUnique({ where: { id: participanteId } });
    if (!atual) throw new NotFoundException('Participante não encontrado');
    const estado: EstadoParticipante = presente ? 'PRESENTE' : atual.origem === 'PRE_INSCRICAO' ? 'AUSENTE' : 'CONFIRMADO';
    const participante = await this.prisma.eventoParticipante.update({
      where: { id: participanteId }, data: { presente: !!presente, estado },
    });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId, action: 'EVENTO_PRESENCA_MARCADA', entity: 'EventoParticipante', entityId: participanteId,
        oldValues: { estado: atual.estado }, newValues: { presente, estado },
      });
    }
    return participante;
  }

  async removeParticipante(participanteId: string, actorUserId?: string) {
    const participante = await this.prisma.eventoParticipante.delete({ where: { id: participanteId } });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId, action: 'EVENTO_PARTICIPANTE_REMOVIDO', entity: 'EventoParticipante', entityId: participanteId,
        oldValues: { eventoId: participante.eventoId, nome: participante.nome, origem: participante.origem },
      });
    }
    return participante;
  }

  async exportarCsv(eventoId: string, actorUserId: string) {
    const ev = await this.prisma.evento.findUnique({ where: { id: eventoId }, select: { nome: true } });
    if (!ev) throw new NotFoundException('Evento não encontrado');
    const rows = await this.listParticipantes(eventoId);
    const cab = [
      'Nome', 'Estado', 'Origem', 'Contacto', 'Email', 'Data nascimento', 'Submetido em',
      'Tipo formulário', 'Responsável/Escola', 'Idade', 'Classe', 'Horário', 'Nível natação', 'Provas',
      'Autoriza imagem', 'Pedido de inscrição', 'Pacote', 'Preço (MT)', 'Início', 'Fim previsto', 'Encarregado',
      'Validado em', 'Validado por', 'Motivo rejeição',
    ];
    const linhas = rows.map((p) => {
      const d: any = p.dadosFormulario ?? {};
      const i: any = p.inscricao?.dados ?? {};
      return [
        p.nomeExibicao, ESTADO_LABEL[p.estado as EstadoParticipante] ?? p.estado, p.origem, p.contacto, p.email,
        p.dataNascimento ? p.dataNascimento.toISOString().slice(0, 10) : '', p.submetidoEm,
        p.inscricao?.tipo ?? '', p.inscricao?.tipo === 'ESCOLA' ? `${i.escola ?? ''} — ${p.inscricao.responsavelNome}` : '',
        d.idade ?? '', d.classe ?? '', d.horario ?? '', d.nivelNatacao ?? '', Array.isArray(d.provas) ? d.provas.join(', ') : '',
        p.autorizacaoImagem == null ? '' : p.autorizacaoImagem ? 'Sim' : 'Não', p.lead ? 'Sim' : '',
        p.pacoteNome ?? '', p.pacotePreco ?? '', dateParaDia(p.dataInicioPretendida) ?? '', dateParaDia(p.dataFimPrevista) ?? '',
        p.inscricao?.tipo === 'PROGRAMA' ? p.inscricao.responsavelNome : '',
        p.validadoEm ?? '', p.validadoPorNome ?? '', p.motivoRejeicao ?? '',
      ];
    });
    await this.audit.log({
      userId: actorUserId, action: 'EVENTO_PARTICIPANTES_EXPORTADOS', entity: 'Evento', entityId: eventoId,
      newValues: { total: linhas.length },
    });
    const nomeFicheiro = `participantes-${ev.nome.replace(/[^\w-]+/g, '_').slice(0, 40)}.csv`;
    return { csv: gerarCsv(cab, linhas), nomeFicheiro };
  }

  // ─── Formulário público (sem login) ────────────────────────────────────────

  private async eventoPorToken(token: string) {
    if (!token || token.length < 16 || token.length > 64) throw new NotFoundException('Evento não encontrado');
    const ev = await this.prisma.evento.findUnique({
      where: { tokenPublico: token },
      include: {
        unidade: { select: { nome: true, endereco: true } },
        imagens: { select: { url: true, legenda: true, cartaz: true }, orderBy: ORDEM_IMAGENS },
      },
    });
    if (!ev) throw new NotFoundException('Evento não encontrado');
    return ev;
  }

  /** Só informação pública do evento — nunca dados de participantes. */
  async getPublico(token: string) {
    const ev = await this.eventoPorToken(token);
    if (ev.formularioTipo === 'PROGRAMA') return this.getPublicoPrograma(ev);
    const ocupados = await this.prisma.eventoParticipante.count({ where: { eventoId: ev.id, estado: { not: 'CANCELADO' } } });
    const vagas = vagasDisponiveis(ev.capacidade, ocupados);
    return {
      nome: ev.nome,
      tipo: ev.tipo,
      descricao: ev.descricao,
      programa: ev.programa,
      data: ev.data,
      hora: ev.hora,
      local: ev.local ?? ev.unidade?.endereco ?? null,
      unidade: ev.unidade?.nome ?? null,
      formularioTipo: ev.formularioTipo,
      formulario: lerConfigFormulario(ev.formularioTipo, ev.formularioCampos),
      imagens: ev.imagens,
      inscricoesAbertas: ev.inscricoesAbertas && ev.estado === 'PLANEADO' && vagas !== 0,
      motivoFechado: !ev.inscricoesAbertas || ev.estado !== 'PLANEADO'
        ? 'As pré-inscrições para este evento estão encerradas.'
        : vagas === 0 ? 'Já não há vagas disponíveis para este evento.' : null,
      lotado: vagas === 0,
    };
  }

  private assertAberto(ev: { inscricoesAbertas: boolean; estado: string }) {
    if (!ev.inscricoesAbertas || ev.estado !== 'PLANEADO') {
      throw new GoneException('As pré-inscrições para este evento estão encerradas.');
    }
  }

  async submeterIndividual(token: string, dto: PreInscricaoIndividualDto) {
    const ev = await this.eventoPorToken(token);
    this.assertAberto(ev);
    if (ev.formularioTipo !== 'INDIVIDUAL') throw new BadRequestException('Este evento usa outro formulário de inscrição');
    if (!dto.declaracao) throw new BadRequestException('É necessário confirmar a declaração para submeter');

    const cfg = lerConfigFormulario(ev.formularioTipo, ev.formularioCampos);
    const ativo = (c: string) => cfg.campos.includes(c);
    // Só se guardam os campos activos neste evento (minimização de dados).
    const respostas: Record<string, any> = {};
    const copiar = (campo: string, ...chaves: (keyof PreInscricaoIndividualDto)[]) => {
      if (!ativo(campo)) return;
      for (const k of chaves) if (dto[k] !== undefined && dto[k] !== null && dto[k] !== '') respostas[k as string] = dto[k];
    };
    copiar('nomePreferido', 'nomePreferido');
    copiar('genero', 'genero');
    copiar('documentoIdentificacao', 'documentoIdentificacao');
    copiar('provas', 'provas');
    copiar('experienciaPrevia', 'experienciaPrevia');
    copiar('comoConheceu', 'comoConheceu');
    copiar('nivelNatacao', 'nivelNatacao');
    copiar('condicaoSaude', 'condicaoSaude', 'condicaoSaudeDetalhe');
    copiar('contactoEmergencia', 'contactoEmergencia', 'parentescoEmergencia');
    copiar('instituicao', 'instituicao');
    if (respostas.condicaoSaude === false) delete respostas.condicaoSaudeDetalhe;
    if (respostas.condicaoSaude === true && !respostas.condicaoSaudeDetalhe) {
      throw new BadRequestException('Indique qual a condição de saúde');
    }

    const dataNascimento = ativo('dataNascimento') && dto.dataNascimento ? new Date(dto.dataNascimento) : null;
    if (dataNascimento && (dataNascimento.getTime() > Date.now() || dataNascimento.getFullYear() < 1900)) {
      throw new BadRequestException('Data de nascimento inválida');
    }
    const email = ativo('email') ? normalizarEmail(dto.email) : null;
    const contacto = normalizarTelefone(dto.contacto);

    return this.prisma.$transaction(async (tx) => {
      const existentes = await tx.eventoParticipante.findMany({
        where: { eventoId: ev.id }, select: { nome: true, contacto: true, email: true, estado: true },
      });
      if (eDuplicado({ nome: dto.nomeCompleto, contacto, email }, existentes)) {
        throw new ConflictException('Já existe uma pré-inscrição com este nome e contacto para este evento.');
      }
      const vagas = vagasDisponiveis(ev.capacidade, existentes.filter((p) => p.estado !== 'CANCELADO').length);
      if (vagas === 0) throw new GoneException('Já não há vagas disponíveis para este evento.');

      const agora = new Date();
      const inscricao = await tx.eventoInscricao.create({
        data: {
          eventoId: ev.id, tipo: 'INDIVIDUAL', responsavelNome: dto.nomeCompleto, contacto, email,
          dados: JSON.stringify(respostas), declaracaoAceite: true, submetidoEm: agora,
        },
      });
      await tx.eventoParticipante.create({
        data: {
          eventoId: ev.id, inscricaoId: inscricao.id, nome: dto.nomeCompleto, contacto, email, dataNascimento,
          dadosFormulario: JSON.stringify(respostas),
          autorizacaoImagem: ativo('autorizacaoImagem') && dto.autorizacaoImagem !== undefined ? !!dto.autorizacaoImagem : null,
          origem: 'PRE_INSCRICAO', estado: 'PRE_INSCRITO', presente: false, submetidoEm: agora,
        },
      });
      return { ok: true, referencia: inscricao.id.slice(0, 8).toUpperCase(), submetidoEm: agora, evento: ev.nome };
    });
  }

  async submeterEscola(token: string, dto: PreInscricaoEscolaDto) {
    const ev = await this.eventoPorToken(token);
    this.assertAberto(ev);
    if (ev.formularioTipo !== 'ESCOLA') throw new BadRequestException('Este evento usa outro formulário de inscrição');
    if (!dto.declaracao) throw new BadRequestException('É necessário confirmar a declaração para submeter');

    const cfg = lerConfigFormulario(ev.formularioTipo, ev.formularioCampos);
    const horarios = cfg.horarios.length ? cfg.horarios : HORARIOS_ESCOLA_OMISSAO;
    for (const a of dto.alunos) {
      if (a.horario && !horarios.includes(a.horario)) throw new BadRequestException(`Horário inválido para ${a.nome}`);
    }
    if (dto.semanaInicio && dto.semanaFim && new Date(dto.semanaFim) < new Date(dto.semanaInicio)) {
      throw new BadRequestException('A semana de fim não pode ser anterior à de início');
    }
    // Alunos repetidos no próprio formulário
    const nomes = dto.alunos.map((a) => a.nome.trim().toLowerCase());
    if (new Set(nomes).size !== nomes.length) throw new BadRequestException('Há alunos repetidos no formulário');

    const contactoEscola = normalizarTelefone(dto.contactoEscola);
    const email = normalizarEmail(dto.email);

    return this.prisma.$transaction(async (tx) => {
      const anteriores = await tx.eventoInscricao.findMany({
        where: { eventoId: ev.id, tipo: 'ESCOLA', contacto: contactoEscola }, select: { dados: true },
      });
      const mesmaEscola = anteriores.some((i) => {
        const d = this.parseJson(i.dados);
        return (d?.escola ?? '').trim().toLowerCase() === dto.escola.trim().toLowerCase();
      });
      const existentes = await tx.eventoParticipante.findMany({
        where: { eventoId: ev.id }, select: { nome: true, contacto: true, email: true, estado: true, inscricaoId: true },
      });
      if (mesmaEscola) {
        throw new ConflictException('Esta escola já submeteu uma inscrição para este evento. Contacte-nos para acrescentar alunos.');
      }
      const ocupados = existentes.filter((p) => p.estado !== 'CANCELADO').length;
      const vagas = vagasDisponiveis(ev.capacidade, ocupados);
      if (vagas !== null && vagas < dto.alunos.length) {
        throw new GoneException(vagas === 0 ? 'Já não há vagas disponíveis.' : `Restam apenas ${vagas} vaga(s) neste evento.`);
      }

      const agora = new Date();
      const dadosEscola = {
        escola: dto.escola, responsavel: dto.responsavel, localAulas: dto.localAulas,
        semanaInicio: dto.semanaInicio, semanaFim: dto.semanaFim, observacoes: dto.observacoes,
      };
      const inscricao = await tx.eventoInscricao.create({
        data: {
          eventoId: ev.id, tipo: 'ESCOLA', responsavelNome: dto.responsavel, contacto: contactoEscola, email,
          dados: JSON.stringify(dadosEscola), declaracaoAceite: true, submetidoEm: agora,
        },
      });
      for (const a of dto.alunos) {
        // Contacto do aluno = contacto do encarregado, se indicado. Não se usa o da escola como se fosse do aluno.
        await tx.eventoParticipante.create({
          data: {
            eventoId: ev.id, inscricaoId: inscricao.id, nome: a.nome,
            contacto: normalizarTelefone(a.contactoEncarregado),
            dadosFormulario: JSON.stringify({ idade: a.idade, classe: a.classe, horario: a.horario, escola: dto.escola }),
            origem: 'PRE_INSCRICAO', estado: 'PRE_INSCRITO', presente: false, submetidoEm: agora,
          },
        });
      }
      return {
        ok: true, referencia: inscricao.id.slice(0, 8).toUpperCase(), submetidoEm: agora,
        evento: ev.nome, alunos: dto.alunos.length,
      };
    });
  }

  // ─── Programa (férias) com pacotes ─────────────────────────────────────────

  private periodoPrograma(ev: { data: Date; dataFim: Date | null }) {
    return { inicio: diaLocal(ev.data), fim: ev.dataFim ? diaLocal(ev.dataFim) : null };
  }

  /** Info pública de um programa: período e pacotes activos. Nunca dados de participantes. */
  private async getPublicoPrograma(ev: any) {
    const pacotes = await this.prisma.eventoPacote.findMany({
      where: { eventoId: ev.id, ativo: true },
      orderBy: [{ ordem: 'asc' }, { preco: 'asc' }],
      select: { id: true, nome: true, descricao: true, preco: true, dias: true },
    });
    const periodo = this.periodoPrograma(ev);
    const hoje = diaLocal(new Date());
    const terminou = !!periodo.fim && hoje > periodo.fim;
    const aberto = ev.inscricoesAbertas && ev.estado === 'PLANEADO' && !terminou && pacotes.length > 0;
    return {
      nome: ev.nome,
      tipo: ev.tipo,
      descricao: ev.descricao,
      programa: ev.programa,
      data: ev.data,
      dataFim: ev.dataFim,
      hora: ev.hora,
      local: ev.local ?? ev.unidade?.endereco ?? null,
      unidade: ev.unidade?.nome ?? null,
      formularioTipo: ev.formularioTipo,
      formulario: lerConfigFormulario(ev.formularioTipo, ev.formularioCampos),
      periodo,
      hoje,
      pacotes,
      imagens: ev.imagens ?? [],
      inscricoesAbertas: aberto,
      motivoFechado: aberto
        ? null
        : terminou
          ? 'Este programa já terminou.'
          : !pacotes.length && ev.inscricoesAbertas && ev.estado === 'PLANEADO'
            ? 'As inscrições abrem em breve.'
            : 'As inscrições para este programa estão encerradas.',
      lotado: false,
    };
  }

  /** Participantes não cancelados cujo período se sobrepõe a [inicio, fim]. Sem datas → conta sempre. */
  private sobrepostos<T extends { dataInicioPretendida: Date | null; dataFimPrevista: Date | null }>(
    rows: T[], inicio: string, fim: string,
  ): T[] {
    return rows.filter((p) => {
      const a = dateParaDia(p.dataInicioPretendida);
      if (!a) return true;
      const b = dateParaDia(p.dataFimPrevista) ?? a;
      return periodosSobrepostos(a, b, inicio, fim);
    });
  }

  async submeterPrograma(token: string, dto: InscricaoProgramaDto) {
    const ev = await this.eventoPorToken(token);
    this.assertAberto(ev);
    if (ev.formularioTipo !== 'PROGRAMA') throw new BadRequestException('Este evento usa outro formulário de inscrição');
    if (!dto.declaracao) throw new BadRequestException('É necessário confirmar a declaração para submeter');
    if (dto.condicaoSaude === true && !dto.condicaoSaudeDetalhe) throw new BadRequestException('Indique qual a condição de saúde');

    const periodo = this.periodoPrograma(ev);
    const hoje = diaLocal(new Date());
    if (periodo.fim && hoje > periodo.fim) throw new GoneException('Este programa já terminou.');
    const idade = idadeEm(dto.dataNascimento, hoje);
    if (idade === null || idade < 1 || idade > 25 || dto.dataNascimento > hoje) {
      throw new BadRequestException('Verifique a data de nascimento da criança.');
    }
    const contacto = normalizarTelefone(dto.contacto);
    const email = normalizarEmail(dto.email);

    const resultado = await this.prisma.$transaction(async (tx) => {
      // Serializa as inscrições do mesmo evento: a contagem de vagas não pode ser ultrapassada em paralelo.
      await tx.$queryRaw`SELECT id FROM eventos WHERE id = ${ev.id} FOR UPDATE`;
      const pacote = await tx.eventoPacote.findFirst({ where: { id: dto.pacoteId, eventoId: ev.id, ativo: true } });
      if (!pacote) throw new BadRequestException('Este pacote já não está disponível. Actualize a página e escolha outro.');

      const v = validarInicioPrograma(dto.dataInicio, periodo, pacote.dias, hoje);
      if (!v.ok) throw new BadRequestException(v.erro);
      const fimPrevisto = v.fimPrevisto ?? periodo.fim ?? dto.dataInicio;

      const existentes = await tx.eventoParticipante.findMany({
        where: { eventoId: ev.id, estado: { not: 'CANCELADO' } },
        select: { nome: true, contacto: true, email: true, estado: true, dataInicioPretendida: true, dataFimPrevista: true },
      });
      const noPeriodo = this.sobrepostos(existentes, dto.dataInicio, fimPrevisto);
      if (eDuplicado({ nome: dto.nomeCrianca, contacto, email }, noPeriodo)) {
        throw new ConflictException('Esta criança já tem uma inscrição para este período com o mesmo contacto.');
      }
      const vagas = vagasDisponiveis(ev.capacidade, noPeriodo.length);
      if (vagas === 0) throw new GoneException('Já não há vagas para o período escolhido. Experimente outra data de início.');

      const agora = new Date();
      const inscricao = await tx.eventoInscricao.create({
        data: {
          eventoId: ev.id, tipo: 'PROGRAMA', responsavelNome: dto.nomeEncarregado, contacto, email,
          dados: JSON.stringify({
            parentesco: dto.parentesco,
            contactoAlternativo: normalizarTelefone(dto.contactoAlternativo) ?? undefined,
            pessoaAutorizadaRecolha: dto.pessoaAutorizadaRecolha,
            observacoes: dto.observacoes,
          }),
          declaracaoAceite: true, submetidoEm: agora,
        },
      });
      await tx.eventoParticipante.create({
        data: {
          eventoId: ev.id, inscricaoId: inscricao.id, nome: dto.nomeCrianca, contacto, email,
          dataNascimento: diaParaDate(dto.dataNascimento),
          dadosFormulario: JSON.stringify({
            idade, genero: dto.genero, escola: dto.escola, nivelNatacao: dto.nivelNatacao,
            provas: dto.provas?.length ? Array.from(new Set(dto.provas)) : undefined,
            condicaoSaude: dto.condicaoSaude, condicaoSaudeDetalhe: dto.condicaoSaude ? dto.condicaoSaudeDetalhe : undefined,
          }),
          autorizacaoImagem: dto.autorizacaoImagem === undefined ? null : !!dto.autorizacaoImagem,
          eventoPacoteId: pacote.id, pacoteNome: pacote.nome, pacotePreco: pacote.preco,
          dataInicioPretendida: diaParaDate(dto.dataInicio), dataFimPrevista: diaParaDate(fimPrevisto),
          origem: 'PRE_INSCRICAO', estado: 'PRE_INSCRITO', presente: false, submetidoEm: agora,
        },
      });
      return {
        ok: true, referencia: inscricao.id.slice(0, 8).toUpperCase(), submetidoEm: agora, evento: ev.nome,
        pacote: pacote.nome, preco: pacote.preco, dataInicio: dto.dataInicio, dataFimPrevista: fimPrevisto,
      };
    });

    // Aviso interno à secretaria. Sem nomes nem contactos na notificação (minimização de dados).
    const titulo = `Nova inscrição por validar — ${ev.nome}`;
    const corpo = `Ref. ${resultado.referencia} · ${resultado.pacote} (${fmtMt(resultado.preco)}) · início ${fmtDia(resultado.dataInicio)}. Abra Eventos → Gerir para validar.`;
    for (const role of ROLES_VALIDACAO) {
      await this.notifications.createForRole(role, 'EVENTO_INSCRICAO', titulo, corpo).catch(() => undefined);
    }
    return resultado;
  }

  // ─── Pacotes do evento (staff) ─────────────────────────────────────────────

  // ─── Imagens / cartazes ────────────────────────────────────────────────────

  /** Caminho no disco de uma imagem de evento registada; 404 para qualquer outro nome. */
  async caminhoImagemPublica(nome: string): Promise<string> {
    if (typeof nome !== 'string' || !NOME_IMAGEM_EVENTO.test(nome)) throw new NotFoundException('Imagem não encontrada');
    const existe = await this.prisma.eventoImagem.findFirst({ where: { url: `/uploads/${nome}` }, select: { id: true } });
    if (!existe) throw new NotFoundException('Imagem não encontrada');
    const caminho = join(process.cwd(), 'uploads', nome);
    try { await access(caminho); } catch { throw new NotFoundException('Imagem não encontrada'); }
    return caminho;
  }

  private async apagarFicheiro(url?: string | null) {
    if (!url?.startsWith('/uploads/') || url.includes('..')) return;
    await unlink(join(process.cwd(), url.replace(/^\//, ''))).catch(() => undefined);
  }

  private async lerAssinatura(caminho: string): Promise<Buffer> {
    const fh = await open(caminho, 'r');
    try {
      const buf = Buffer.alloc(12);
      const { bytesRead } = await fh.read(buf, 0, 12, 0);
      return buf.subarray(0, bytesRead);
    } finally {
      await fh.close();
    }
  }

  async listarImagens(eventoId: string) {
    return this.prisma.eventoImagem.findMany({ where: { eventoId }, select: IMAGEM_SELECT, orderBy: ORDEM_IMAGENS });
  }

  async adicionarImagem(eventoId: string, file: Express.Multer.File, dto: ImagemEventoDto, actorUserId: string) {
    if (!file) throw new BadRequestException('Nenhuma imagem enviada (JPEG, PNG ou WEBP, máx. 8 MB)');
    const url = `/uploads/${file.filename}`;
    try {
      const formato = formatoPorAssinatura(await this.lerAssinatura(file.path));
      if (!formato || formato !== file.mimetype) throw new BadRequestException('O ficheiro não é uma imagem JPEG, PNG ou WEBP válida');
      const ev = await this.prisma.evento.findUnique({ where: { id: eventoId }, select: { id: true } });
      if (!ev) throw new NotFoundException('Evento não encontrado');
      const imagem = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM eventos WHERE id = ${eventoId} FOR UPDATE`;
        const total = await tx.eventoImagem.count({ where: { eventoId } });
        if (total >= MAX_IMAGENS_POR_EVENTO) {
          throw new BadRequestException(`Máximo de ${MAX_IMAGENS_POR_EVENTO} imagens por evento — remova alguma primeiro`);
        }
        const cartaz = dto.cartaz === true || total === 0;
        if (cartaz) await tx.eventoImagem.updateMany({ where: { eventoId, cartaz: true }, data: { cartaz: false } });
        return tx.eventoImagem.create({
          data: { eventoId, url, legenda: dto.legenda ?? null, cartaz, ordem: dto.ordem ?? total, tamanho: file.size, criadoPorId: actorUserId },
          select: IMAGEM_SELECT,
        });
      });
      await this.audit.log({
        userId: actorUserId, action: 'EVENTO_IMAGEM_ADICIONADA', entity: 'Evento', entityId: eventoId,
        newValues: { imagemId: imagem.id, cartaz: imagem.cartaz, tamanho: file.size },
      });
      return imagem;
    } catch (e) {
      await this.apagarFicheiro(url);
      throw e;
    }
  }

  async actualizarImagem(imagemId: string, dto: ImagemEventoDto, actorUserId: string) {
    const img = await this.prisma.eventoImagem.findUnique({ where: { id: imagemId } });
    if (!img) throw new NotFoundException('Imagem não encontrada');
    const data: any = {};
    if (dto.legenda !== undefined) data.legenda = dto.legenda || null;
    if (dto.ordem !== undefined) data.ordem = dto.ordem;
    if (dto.cartaz === true) data.cartaz = true;
    const atualizada = await this.prisma.$transaction(async (tx) => {
      if (dto.cartaz === true) {
        await tx.eventoImagem.updateMany({ where: { eventoId: img.eventoId, cartaz: true, NOT: { id: imagemId } }, data: { cartaz: false } });
      }
      return tx.eventoImagem.update({ where: { id: imagemId }, data, select: IMAGEM_SELECT });
    });
    await this.audit.log({
      userId: actorUserId, action: 'EVENTO_IMAGEM_ACTUALIZADA', entity: 'Evento', entityId: img.eventoId,
      oldValues: { legenda: img.legenda, cartaz: img.cartaz, ordem: img.ordem }, newValues: { imagemId, ...data },
    });
    return atualizada;
  }

  async removerImagem(imagemId: string, actorUserId: string) {
    const img = await this.prisma.eventoImagem.findUnique({ where: { id: imagemId } });
    if (!img) throw new NotFoundException('Imagem não encontrada');
    await this.prisma.$transaction(async (tx) => {
      await tx.eventoImagem.delete({ where: { id: imagemId } });
      if (img.cartaz) {
        const proxima = await tx.eventoImagem.findFirst({ where: { eventoId: img.eventoId }, orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }] });
        if (proxima) await tx.eventoImagem.update({ where: { id: proxima.id }, data: { cartaz: true } });
      }
    });
    await this.apagarFicheiro(img.url);
    await this.audit.log({
      userId: actorUserId, action: 'EVENTO_IMAGEM_REMOVIDA', entity: 'Evento', entityId: img.eventoId,
      oldValues: { imagemId, url: img.url, cartaz: img.cartaz },
    });
    return { ok: true };
  }

  async listarPacotes(eventoId: string) {
    const ev = await this.prisma.evento.findUnique({ where: { id: eventoId }, select: { id: true } });
    if (!ev) throw new NotFoundException('Evento não encontrado');
    const pacotes = await this.prisma.eventoPacote.findMany({
      where: { eventoId }, orderBy: [{ ordem: 'asc' }, { preco: 'asc' }],
      include: { _count: { select: { participantes: true } } },
    });
    return pacotes.map(({ _count, ...p }) => ({ ...p, inscricoes: _count.participantes }));
  }

  async criarPacote(eventoId: string, dto: PacoteEventoDto, actorUserId: string) {
    const ev = await this.prisma.evento.findUnique({ where: { id: eventoId }, select: { id: true } });
    if (!ev) throw new NotFoundException('Evento não encontrado');
    const pacote = await this.prisma.eventoPacote.create({
      data: {
        eventoId, nome: dto.nome, descricao: dto.descricao ?? null, preco: dto.preco,
        dias: dto.dias ?? null, ativo: dto.ativo ?? true, ordem: dto.ordem ?? 0,
      },
    });
    await this.audit.log({
      userId: actorUserId, action: 'EVENTO_PACOTE_CRIADO', entity: 'EventoPacote', entityId: pacote.id,
      newValues: { eventoId, nome: pacote.nome, preco: pacote.preco, dias: pacote.dias },
    });
    return pacote;
  }

  async actualizarPacote(pacoteId: string, dto: PacoteEventoDto, actorUserId: string) {
    const antes = await this.prisma.eventoPacote.findUnique({ where: { id: pacoteId } });
    if (!antes) throw new NotFoundException('Pacote não encontrado');
    // As inscrições já feitas guardam o nome e o preço da altura: mudar aqui não altera o que foi aceite.
    const pacote = await this.prisma.eventoPacote.update({
      where: { id: pacoteId },
      data: {
        nome: dto.nome, descricao: dto.descricao ?? null, preco: dto.preco, dias: dto.dias ?? null,
        ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}), ...(dto.ordem !== undefined ? { ordem: dto.ordem } : {}),
      },
    });
    await this.audit.log({
      userId: actorUserId, action: 'EVENTO_PACOTE_ACTUALIZADO', entity: 'EventoPacote', entityId: pacoteId,
      oldValues: { nome: antes.nome, preco: antes.preco, dias: antes.dias, ativo: antes.ativo },
      newValues: { nome: pacote.nome, preco: pacote.preco, dias: pacote.dias, ativo: pacote.ativo },
    });
    return pacote;
  }

  /** Apaga só pacotes nunca usados; os usados são desactivados para manter o histórico. */
  async removerPacote(pacoteId: string, actorUserId: string) {
    const pacote = await this.prisma.eventoPacote.findUnique({
      where: { id: pacoteId }, include: { _count: { select: { participantes: true } } },
    });
    if (!pacote) throw new NotFoundException('Pacote não encontrado');
    if (pacote._count.participantes > 0) {
      await this.prisma.eventoPacote.update({ where: { id: pacoteId }, data: { ativo: false } });
      await this.audit.log({
        userId: actorUserId, action: 'EVENTO_PACOTE_DESACTIVADO', entity: 'EventoPacote', entityId: pacoteId,
        oldValues: { ativo: pacote.ativo }, newValues: { ativo: false, inscricoes: pacote._count.participantes },
      });
      return { removido: false, desactivado: true };
    }
    await this.prisma.eventoPacote.delete({ where: { id: pacoteId } });
    await this.audit.log({
      userId: actorUserId, action: 'EVENTO_PACOTE_REMOVIDO', entity: 'EventoPacote', entityId: pacoteId,
      oldValues: { eventoId: pacote.eventoId, nome: pacote.nome, preco: pacote.preco },
    });
    return { removido: true, desactivado: false };
  }

  // ─── Validação das inscrições (ADMIN / ASSISTENTE_ADMIN) ───────────────────

  private async participanteParaDecisao(participanteId: string) {
    const p = await this.prisma.eventoParticipante.findUnique({
      where: { id: participanteId },
      include: {
        evento: { select: { id: true, nome: true, local: true, hora: true } },
        inscricao: { select: { id: true, responsavelNome: true } },
      },
    });
    if (!p) throw new NotFoundException('Inscrição não encontrada');
    return p;
  }

  /**
   * Avisa o encarregado só pelos contactos que existem. WhatsApp fica na caixa de
   * saída para envio manual (não é marcado como enviado); email só se o SMTP o aceitar.
   */
  private async avisarEncarregado(
    p: { id: string; contacto: string | null; email: string | null; studentId: string | null },
    titulo: string, mensagem: string, actorUserId: string,
  ) {
    const telefone = normalizarTelefone(p.contacto);
    let whatsapp: 'EM_FILA' | 'SEM_CONTACTO' = 'SEM_CONTACTO';
    if (telefone) {
      await this.whatsapp.enqueue({
        tipo: 'EVENTO_INSCRICAO', telefone, mensagem, studentId: p.studentId ?? undefined, criadoPorId: actorUserId,
      });
      whatsapp = 'EM_FILA';
    }
    let email: 'ENVIADO' | 'NAO_ENVIADO' | 'SEM_EMAIL' = 'SEM_EMAIL';
    if (p.email) {
      const ok = await this.email.sendComunicacao(p.email, titulo, mensagem).catch(() => false);
      email = ok ? 'ENVIADO' : 'NAO_ENVIADO';
    }
    await this.audit.log({
      userId: actorUserId, action: 'EVENTO_INSCRICAO_AVISO', entity: 'EventoParticipante', entityId: p.id,
      newValues: { whatsapp, email },
    });
    return { whatsapp, email };
  }

  async validarParticipante(participanteId: string, dto: ValidarParticipanteDto, actorUserId: string) {
    const p = await this.participanteParaDecisao(participanteId);
    if (p.estado !== 'PRE_INSCRITO') {
      throw new ConflictException(`Esta inscrição já foi decidida (estado: ${ESTADO_LABEL[p.estado as EstadoParticipante] ?? p.estado}).`);
    }
    const agora = new Date();
    const r = await this.prisma.eventoParticipante.updateMany({
      where: { id: participanteId, estado: 'PRE_INSCRITO' },
      data: { estado: 'CONFIRMADO', validadoEm: agora, validadoPorId: actorUserId, motivoRejeicao: null },
    });
    if (r.count === 0) throw new ConflictException('A inscrição foi alterada entretanto. Actualize a lista.');
    await this.audit.log({
      userId: actorUserId, action: 'EVENTO_INSCRICAO_VALIDADA', entity: 'EventoParticipante', entityId: participanteId,
      oldValues: { estado: p.estado },
      newValues: { estado: 'CONFIRMADO', pacote: p.pacoteNome, preco: p.pacotePreco, nota: dto.nota },
    });

    let aviso: { whatsapp: string; email: string } | null = null;
    if (dto.avisar) {
      const ref = (p.inscricao?.id ?? p.id).slice(0, 8).toUpperCase();
      const linhas = [
        `Olá${p.inscricao?.responsavelNome ? ` ${p.inscricao.responsavelNome}` : ''}!`,
        `A inscrição de ${p.nome ?? 'o seu educando'} no ${p.evento.nome} foi confirmada.`,
        p.pacoteNome ? `Pacote: ${p.pacoteNome}${p.pacotePreco != null ? ` — ${fmtMt(p.pacotePreco)}` : ''}` : null,
        p.dataInicioPretendida ? `Início: ${fmtDia(dateParaDia(p.dataInicioPretendida))}${p.dataFimPrevista ? ` · até ${fmtDia(dateParaDia(p.dataFimPrevista))}` : ''}` : null,
        p.evento.local ? `Local: ${p.evento.local}` : null,
        dto.nota ? dto.nota : null,
        `Referência: ${ref}`,
        'Mastchieve',
      ].filter(Boolean);
      aviso = await this.avisarEncarregado(p, `Inscrição confirmada — ${p.evento.nome}`, linhas.join('\n'), actorUserId);
    }
    return { ok: true, estado: 'CONFIRMADO', aviso };
  }

  async rejeitarParticipante(participanteId: string, dto: RejeitarParticipanteDto, actorUserId: string) {
    const p = await this.participanteParaDecisao(participanteId);
    if (p.estado !== 'PRE_INSCRITO') {
      throw new ConflictException(`Esta inscrição já foi decidida (estado: ${ESTADO_LABEL[p.estado as EstadoParticipante] ?? p.estado}).`);
    }
    const agora = new Date();
    const r = await this.prisma.eventoParticipante.updateMany({
      where: { id: participanteId, estado: 'PRE_INSCRITO' },
      data: { estado: 'CANCELADO', presente: false, validadoEm: agora, validadoPorId: actorUserId, motivoRejeicao: dto.motivo },
    });
    if (r.count === 0) throw new ConflictException('A inscrição foi alterada entretanto. Actualize a lista.');
    await this.audit.log({
      userId: actorUserId, action: 'EVENTO_INSCRICAO_REJEITADA', entity: 'EventoParticipante', entityId: participanteId,
      oldValues: { estado: p.estado }, newValues: { estado: 'CANCELADO', motivo: dto.motivo },
    });

    let aviso: { whatsapp: string; email: string } | null = null;
    if (dto.avisar) {
      const linhas = [
        `Olá${p.inscricao?.responsavelNome ? ` ${p.inscricao.responsavelNome}` : ''}.`,
        `Não foi possível confirmar a inscrição de ${p.nome ?? 'o seu educando'} no ${p.evento.nome}.`,
        `Motivo: ${dto.motivo}`,
        'Para mais informações, contacte a Mastchieve.',
      ];
      aviso = await this.avisarEncarregado(p, `Inscrição não confirmada — ${p.evento.nome}`, linhas.join('\n'), actorUserId);
    }
    return { ok: true, estado: 'CANCELADO', aviso };
  }

  /** Corrige o pacote e/ou a data de início, recalculando o período e confirmando vagas. */
  async alterarPacoteParticipante(participanteId: string, dto: AlterarPacoteParticipanteDto, actorUserId: string) {
    const p = await this.prisma.eventoParticipante.findUnique({
      where: { id: participanteId },
      include: { evento: { select: { id: true, data: true, dataFim: true, capacidade: true } } },
    });
    if (!p) throw new NotFoundException('Inscrição não encontrada');
    if (!['PRE_INSCRITO', 'CONFIRMADO'].includes(p.estado)) {
      throw new BadRequestException('Só é possível alterar o pacote de inscrições por validar ou confirmadas.');
    }
    const periodo = this.periodoPrograma(p.evento);
    const inicio = dto.dataInicio ?? dateParaDia(p.dataInicioPretendida) ?? periodo.inicio;

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM eventos WHERE id = ${p.eventoId} FOR UPDATE`;
      const pacote = await tx.eventoPacote.findFirst({ where: { id: dto.pacoteId, eventoId: p.eventoId } });
      if (!pacote) throw new BadRequestException('Pacote inválido para este evento');
      // A secretaria pode corrigir inscrições já a decorrer: não se aplica a regra "data no passado".
      const v = validarInicioPrograma(inicio, periodo, pacote.dias, periodo.inicio);
      if (!v.ok) throw new BadRequestException(v.erro);
      const fim = v.fimPrevisto ?? periodo.fim ?? inicio;

      const outros = await tx.eventoParticipante.findMany({
        where: { eventoId: p.eventoId, estado: { not: 'CANCELADO' }, id: { not: p.id } },
        select: { dataInicioPretendida: true, dataFimPrevista: true },
      });
      if (vagasDisponiveis(p.evento.capacidade, this.sobrepostos(outros, inicio, fim).length) === 0) {
        throw new ConflictException('Não há vagas para o novo período.');
      }
      const actualizado = await tx.eventoParticipante.update({
        where: { id: p.id },
        data: {
          eventoPacoteId: pacote.id, pacoteNome: pacote.nome, pacotePreco: pacote.preco,
          dataInicioPretendida: diaParaDate(inicio), dataFimPrevista: diaParaDate(fim),
        },
      });
      await this.audit.log({
        userId: actorUserId, action: 'EVENTO_INSCRICAO_PACOTE_ALTERADO', entity: 'EventoParticipante', entityId: p.id,
        oldValues: { pacote: p.pacoteNome, preco: p.pacotePreco, inicio: dateParaDia(p.dataInicioPretendida), fim: dateParaDia(p.dataFimPrevista) },
        newValues: { pacote: pacote.nome, preco: pacote.preco, inicio, fim },
      });
      return actualizado;
    });
  }

  // ─── Comunicação pós-evento ────────────────────────────────────────────────

  private async resolverDestinatarios(eventoId: string, estados: string[], participanteIds?: string[]) {
    const where: any = { eventoId, estado: { in: estados } };
    if (participanteIds?.length) where.id = { in: participanteIds };
    const rows = await this.prisma.eventoParticipante.findMany({
      where,
      include: {
        student: {
          select: {
            firstName: true, lastName: true, dateOfBirth: true, phone: true, emergencyPhone: true,
            user: { select: { email: true } },
            parents: { select: { isPrimary: true, parent: { select: { phone: true, firstName: true, lastName: true, user: { select: { email: true } } } } } },
          },
        },
      },
    });
    return rows.map((p) => {
      let telefone = p.contacto;
      let email = p.email;
      if (p.student) {
        const c = resolveContactoAtleta(p.student);
        telefone = telefone || c.telefone;
        const encarregado = p.student.parents.find((x) => x.isPrimary) ?? p.student.parents[0];
        email = email || (c.viaEncarregado ? encarregado?.parent.user?.email : p.student.user?.email) || null;
      }
      return { participanteId: p.id, nome: this.nomeParticipante(p), telefone: telefone ?? null, email: email ?? null };
    });
  }

  private conteudo(ev: { linkInscricaoAtleta: string | null }, dto: ComunicacaoEventoDto) {
    const videoUrl = dto.videoUrl ? urlSegura(dto.videoUrl) : null;
    const galeriaUrl = dto.galeriaUrl ? urlSegura(dto.galeriaUrl) : null;
    if (dto.videoUrl && !videoUrl) throw new BadRequestException('Link do vídeo inválido (use http/https)');
    if (dto.galeriaUrl && !galeriaUrl) throw new BadRequestException('Link da galeria inválido (use http/https)');
    return {
      titulo: dto.titulo,
      mensagem: dto.mensagem,
      videoUrl,
      galeriaUrl,
      proximasActividades: dto.proximasActividades ?? null,
      linkInscricao: dto.incluirLinkInscricao ? ev.linkInscricaoAtleta || `${appUrl()}/register` : null,
    };
  }

  /**
   * Sem `confirmar: true` devolve apenas a pré-visualização (quantos recebem por
   * cada canal e quem não tem contacto). Com confirmação: WhatsApp vai para a
   * caixa de saída existente (envio manual um a um), email pelo SMTP configurado.
   */
  async comunicar(eventoId: string, dto: ComunicacaoEventoDto, actorUserId: string) {
    const ev = await this.prisma.evento.findUnique({ where: { id: eventoId } });
    if (!ev) throw new NotFoundException('Evento não encontrado');
    const conteudo = this.conteudo(ev, dto);
    const destinatarios = await this.resolverDestinatarios(eventoId, dto.estados, dto.participanteIds);
    if (destinatarios.length > MAX_DESTINATARIOS_POR_ENVIO) {
      throw new ForbiddenException(`Máximo de ${MAX_DESTINATARIOS_POR_ENVIO} destinatários por comunicação — filtre por estado.`);
    }
    const plano = planearEnvios(destinatarios, dto.canais as CanalEnvio[]);
    const resumo = {
      totalDestinatarios: destinatarios.length,
      totalWhatsapp: plano.filter((p) => p.canal === 'WHATSAPP').length,
      totalEmail: plano.filter((p) => p.canal === 'EMAIL').length,
      semContacto: plano.filter((p) => p.canal === 'NENHUM').map((p) => ({ participanteId: p.participanteId, nome: p.nome })),
      exemplo: comporMensagem(conteudo, destinatarios[0]?.nome),
    };
    if (!dto.confirmar) return { preview: true, ...resumo };
    if (!destinatarios.length) throw new BadRequestException('Nenhum participante corresponde aos filtros escolhidos');

    const comunicacao = await this.prisma.eventoComunicacao.create({
      data: {
        eventoId, ...conteudo, canais: JSON.stringify(dto.canais), filtroEstados: JSON.stringify(dto.estados),
        totalDestinatarios: resumo.totalDestinatarios, totalWhatsapp: resumo.totalWhatsapp,
        totalEmail: resumo.totalEmail, totalSemContacto: resumo.semContacto.length, criadoPorId: actorUserId,
      },
    });

    const participantes = await this.prisma.eventoParticipante.findMany({
      where: { id: { in: destinatarios.map((d) => d.participanteId) } }, select: { id: true, studentId: true },
    });
    const studentDe = new Map(participantes.map((p) => [p.id, p.studentId]));
    let emailsEnviados = 0;
    let emailsFalhados = 0;

    for (const linha of plano) {
      const mensagem = comporMensagem(conteudo, linha.nome);
      if (linha.canal === 'WHATSAPP') {
        const msg = await this.whatsapp.enqueue({
          tipo: 'EVENTO_POS', telefone: linha.destino!, mensagem,
          studentId: studentDe.get(linha.participanteId) ?? undefined, criadoPorId: actorUserId,
        });
        await this.prisma.eventoComunicacaoEnvio.create({
          data: { comunicacaoId: comunicacao.id, participanteId: linha.participanteId, canal: 'WHATSAPP', destino: linha.destino, estado: 'EM_FILA', mensagemWhatsappId: msg.id },
        });
      } else if (linha.canal === 'EMAIL') {
        const ok = await this.email.sendComunicacao(linha.destino!, conteudo.titulo, mensagem, conteudo.linkInscricao, 'Inscrever como atleta');
        ok ? emailsEnviados++ : emailsFalhados++;
        await this.prisma.eventoComunicacaoEnvio.create({
          data: {
            comunicacaoId: comunicacao.id, participanteId: linha.participanteId, canal: 'EMAIL', destino: linha.destino,
            estado: ok ? 'ENVIADO' : 'FALHOU', erro: ok ? null : 'Email não enviado (SMTP não configurado ou falha no servidor)',
          },
        });
      } else {
        await this.prisma.eventoComunicacaoEnvio.create({
          data: { comunicacaoId: comunicacao.id, participanteId: linha.participanteId, canal: 'NENHUM', estado: 'SEM_CONTACTO' },
        });
      }
    }

    await this.audit.log({
      userId: actorUserId, action: 'EVENTO_COMUNICACAO_ENVIADA', entity: 'EventoComunicacao', entityId: comunicacao.id,
      newValues: {
        eventoId, canais: dto.canais, estados: dto.estados, totalDestinatarios: resumo.totalDestinatarios,
        whatsappEmFila: resumo.totalWhatsapp, emailsEnviados, emailsFalhados, semContacto: resumo.semContacto.length,
      },
    });

    return {
      preview: false, comunicacaoId: comunicacao.id, ...resumo, emailsEnviados, emailsFalhados,
      whatsappEmFila: resumo.totalWhatsapp,
    };
  }

  async listarComunicacoes(eventoId: string) {
    const comunicacoes = await this.prisma.eventoComunicacao.findMany({
      where: { eventoId }, orderBy: { createdAt: 'desc' },
      include: { envios: { include: { participante: { select: { nome: true, student: { select: { firstName: true, lastName: true } } } } } } },
    });
    const msgIds = comunicacoes.flatMap((c) => c.envios.map((e) => e.mensagemWhatsappId).filter(Boolean) as string[]);
    const msgs = msgIds.length
      ? await this.prisma.mensagemWhatsapp.findMany({ where: { id: { in: msgIds } }, select: { id: true, estado: true, enviadoEm: true } })
      : [];
    const estadoMsg = new Map(msgs.map((m) => [m.id, m]));
    return comunicacoes.map((c) => ({
      ...c,
      canais: this.parseJson(c.canais) ?? [],
      filtroEstados: this.parseJson(c.filtroEstados) ?? [],
      envios: c.envios.map((e) => {
        const m = e.mensagemWhatsappId ? estadoMsg.get(e.mensagemWhatsappId) : undefined;
        // WhatsApp só conta como enviado depois de marcado na caixa de saída.
        const estado = e.canal === 'WHATSAPP' && m
          ? m.estado === 'ENVIADA' ? 'ENVIADO' : m.estado === 'CANCELADA' ? 'CANCELADO' : 'EM_FILA'
          : e.estado;
        return { ...e, estado, enviadoEm: m?.enviadoEm ?? null, nome: this.nomeParticipante(e.participante) };
      }),
    }));
  }

  /** Convite para pré-inscrição enviado a leads (caixa de saída WhatsApp, envio manual). */
  async partilharComLeads(eventoId: string, dto: PartilharComLeadsDto, actorUserId: string) {
    const ev = await this.prisma.evento.findUnique({ where: { id: eventoId } });
    if (!ev) throw new NotFoundException('Evento não encontrado');
    if (!ev.tokenPublico || !ev.inscricoesAbertas) {
      throw new BadRequestException('Abra o formulário de pré-inscrição antes de partilhar o evento');
    }
    const where: any = { telefone: { not: null }, estado: dto.estado ? dto.estado : { notIn: ['CONVERTIDO', 'PERDIDO'] } };
    if (dto.origem) where.origem = dto.origem;
    if (dto.unidadeId) where.unidadeId = dto.unidadeId;
    const leads = await this.prisma.lead.findMany({ where, select: { id: true, nome: true, telefone: true } });
    const vistos = new Set<string>();
    const alvo = leads.filter((l) => {
      const t = normalizarTelefone(l.telefone);
      if (!t || vistos.has(t)) return false;
      vistos.add(t);
      return true;
    });
    if (alvo.length > MAX_DESTINATARIOS_POR_ENVIO) {
      throw new ForbiddenException(`Máximo de ${MAX_DESTINATARIOS_POR_ENVIO} leads por envio — filtre por estado/origem/unidade.`);
    }
    const dataTxt = ev.data.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    const base = dto.mensagem?.trim()
      || `Convidamo-lo para o evento "${ev.nome}" no dia ${dataTxt}${ev.hora ? ` às ${ev.hora}` : ''}${ev.local ? `, em ${ev.local}` : ''}.`;
    const texto = (nome: string) =>
      `Olá ${nome.split(/\s+/)[0]}! ${base}\n\nFaça a sua pré-inscrição aqui: ${this.urlPublica(ev.tokenPublico)}\n\n— Mastchieve`;
    if (!dto.confirmar) return { preview: true, total: alvo.length, exemplo: texto(alvo[0]?.nome ?? 'Nome') };

    for (const l of alvo) {
      await this.whatsapp.enqueue({ tipo: 'EVENTO_CONVITE', telefone: l.telefone!, mensagem: texto(l.nome), leadId: l.id, criadoPorId: actorUserId });
    }
    await this.audit.log({
      userId: actorUserId, action: 'EVENTO_CONVITE_LEADS', entity: 'Evento', entityId: eventoId,
      newValues: { total: alvo.length, filtro: { estado: dto.estado, origem: dto.origem, unidadeId: dto.unidadeId } },
    });
    return { preview: false, enfileirados: alvo.length };
  }

  // ─── Conversão em pedido de inscrição ──────────────────────────────────────

  /**
   * Cria (ou reaproveita) um Lead — o pedido de inscrição que a equipa revê no
   * CRM. Não cria atleta nem matrícula automaticamente.
   */
  async converterEmPedido(participanteId: string, actorUserId: string) {
    const p = await this.prisma.eventoParticipante.findUnique({
      where: { id: participanteId },
      include: { evento: true, inscricao: true },
    });
    if (!p) throw new NotFoundException('Participante não encontrado');
    if (p.studentId) throw new ConflictException('Este participante já é atleta registado');
    if (p.leadId) throw new ConflictException('Já existe um pedido de inscrição para este participante');
    if (p.estado === 'CANCELADO') throw new BadRequestException('Participante cancelado');

    const nome = p.nome ?? '';
    const telefone = p.contacto;
    const email = p.email;
    const d: any = this.parseJson(p.dadosFormulario) ?? {};

    // Evita duplicar: reaproveita um lead activo com o mesmo nome e contacto.
    const candidatos = telefone || email
      ? await this.prisma.lead.findMany({
        where: {
          estado: { notIn: ['CONVERTIDO', 'PERDIDO'] },
          OR: [...(telefone ? [{ telefone }] : []), ...(email ? [{ email }] : [])],
        },
      })
      : [];
    const existente = candidatos.find((l) => eDuplicado({ nome, contacto: telefone, email }, [{ ...l, contacto: l.telefone, estado: 'NOVO' }]));

    const resumo = [
      `Pedido de inscrição gerado a partir do evento "${p.evento.nome}" (${p.evento.data.toISOString().slice(0, 10)}).`,
      `Estado no evento: ${ESTADO_LABEL[p.estado as EstadoParticipante] ?? p.estado}.`,
      p.dataNascimento ? `Data de nascimento: ${p.dataNascimento.toISOString().slice(0, 10)}` : null,
      d.genero ? `Género: ${d.genero}` : null,
      d.nivelNatacao ? `Nível de natação declarado: ${d.nivelNatacao}` : null,
      d.experienciaPrevia !== undefined ? `Experiência prévia: ${d.experienciaPrevia ? 'Sim' : 'Não'}` : null,
      d.idade ? `Idade: ${d.idade}` : null,
      d.escola ? `Escola: ${d.escola}${d.classe ? ` (classe ${d.classe})` : ''}` : null,
      d.horario ? `Horário pretendido: ${d.horario}` : null,
      d.condicaoSaude ? 'Declarou condição de saúde — confirmar detalhes na ficha do evento antes da matrícula.' : null,
      p.autorizacaoImagem != null ? `Autorização de imagem: ${p.autorizacaoImagem ? 'Sim' : 'Não'}` : null,
    ].filter(Boolean).join('\n');

    const lead = existente
      ? await this.prisma.lead.update({
        where: { id: existente.id },
        data: { eventoId: existente.eventoId ?? p.eventoId, notas: [existente.notas, resumo].filter(Boolean).join('\n\n') },
      })
      : await this.prisma.lead.create({
        data: {
          nome: nome || 'Participante sem nome',
          telefone, email,
          origem: p.evento.tipo === 'OPEN_DAY' ? 'OPEN_DAY' : p.origem === 'WALK_IN' ? 'WALK_IN' : 'OUTRO',
          campanha: p.evento.nome,
          estado: 'NOVO',
          unidadeId: p.evento.unidadeId,
          eventoId: p.eventoId,
          notas: resumo,
        },
      });

    await this.prisma.eventoParticipante.update({ where: { id: participanteId }, data: { leadId: lead.id } });
    await this.audit.log({
      userId: actorUserId, action: 'EVENTO_PEDIDO_INSCRICAO_CRIADO', entity: 'Lead', entityId: lead.id,
      newValues: { participanteId, eventoId: p.eventoId, reutilizado: !!existente },
    });
    return { lead, reutilizado: !!existente };
  }
}
