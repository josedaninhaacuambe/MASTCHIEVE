// Regras puras dos formulários públicos de pré-inscrição em eventos e da
// comunicação pós-evento. Sem acesso à base de dados → testáveis isoladamente.
//
// Os campos reproduzem os dois modelos fornecidos:
//  • INDIVIDUAL — "Pré-inscrição Open Day 3 (Externos)": uma pessoa por submissão.
//  • ESCOLA     — "Inscrição Escolas · Voucher Natação": um responsável da escola
//                 inscreve até 10 alunos, cada um com um horário.
//  • PROGRAMA   — programa de vários dias (ex.: "Mergulha nas Férias"): o
//                 encarregado inscreve uma criança e escolhe um pacote do evento.

export const FORMULARIO_TIPOS = ['INDIVIDUAL', 'ESCOLA', 'PROGRAMA'] as const;
export type FormularioTipo = (typeof FORMULARIO_TIPOS)[number];

export const ESTADOS_PARTICIPANTE = ['PRE_INSCRITO', 'CONFIRMADO', 'PRESENTE', 'AUSENTE', 'CANCELADO'] as const;
export type EstadoParticipante = (typeof ESTADOS_PARTICIPANTE)[number];

export const ESTADO_LABEL: Record<EstadoParticipante, string> = {
  PRE_INSCRITO: 'Pré-inscrito',
  CONFIRMADO: 'Confirmado',
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente',
  CANCELADO: 'Cancelado',
};

/** Campos opcionais do modelo INDIVIDUAL que o staff pode activar/desactivar por evento. */
export const CAMPOS_INDIVIDUAL = [
  'nomePreferido',
  'genero',
  'dataNascimento',
  'email',
  'documentoIdentificacao',
  'provas',
  'experienciaPrevia',
  'comoConheceu',
  'nivelNatacao',
  'condicaoSaude',
  'contactoEmergencia',
  'instituicao',
  'autorizacaoImagem',
] as const;

// O nº do documento de identificação consta do modelo, mas não é necessário
// para uma pré-inscrição: fica desligado por omissão (minimização de dados).
export const CAMPOS_INDIVIDUAL_OMISSAO = CAMPOS_INDIVIDUAL.filter((c) => c !== 'documentoIdentificacao');

export const PROVAS = ['CHOURICO', 'PRANCHA', 'BRACOS', 'CRAWL', 'COSTAS', 'BRUCOS'] as const;
export const NIVEIS_NATACAO = ['NAO', 'POUCO', 'RAZOAVEL', 'BEM'] as const;
export const HORARIOS_ESCOLA_OMISSAO = ['13H30-14H20', '14H30-15H20', '15H30-16H20', '16H30-17H20', '17H30-18H20'];
export const MAX_ALUNOS_ESCOLA = 10;

export interface ConfigFormulario {
  campos: string[];
  horarios: string[];
}

export function lerConfigFormulario(tipo: string, json?: string | null): ConfigFormulario {
  let raw: any = {};
  try { raw = json ? JSON.parse(json) : {}; } catch { raw = {}; }
  const campos = Array.isArray(raw.campos)
    ? raw.campos.filter((c: string) => (CAMPOS_INDIVIDUAL as readonly string[]).includes(c))
    : [...CAMPOS_INDIVIDUAL_OMISSAO];
  const horarios = Array.isArray(raw.horarios) && raw.horarios.length
    ? raw.horarios.map((h: any) => String(h).trim()).filter(Boolean).slice(0, 12)
    : [...HORARIOS_ESCOLA_OMISSAO];
  if (tipo === 'PROGRAMA') return { campos: [], horarios: [] };
  return tipo === 'ESCOLA' ? { campos: [], horarios } : { campos, horarios: [] };
}

// ─── Programa (férias) ─────────────────────────────────────────────────────
// As datas do programa são dias de calendário em Moçambique (UTC+2, sem hora
// de Verão). Trabalhamos com 'YYYY-MM-DD' para não depender do fuso do servidor.

const FUSO_MOCAMBIQUE_MS = 2 * 60 * 60 * 1000;

/** Dia de calendário em Moçambique ('YYYY-MM-DD') de um instante. */
export function diaLocal(d: Date): string {
  return new Date(d.getTime() + FUSO_MOCAMBIQUE_MS).toISOString().slice(0, 10);
}

function parseDia(dia: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return null;
  const d = new Date(`${dia}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== dia ? null : d;
}

export function eDiaUtil(dia: string): boolean {
  const d = parseDia(dia);
  if (!d) return false;
  const w = d.getUTCDay();
  return w >= 1 && w <= 5;
}

/** Último dia coberto por `dias` dias úteis a começar em `inicio` (inclusive). */
export function somarDiasUteis(inicio: string, dias: number): string {
  const d = parseDia(inicio);
  if (!d) throw new Error('Data inválida');
  let restantes = Math.max(1, Math.floor(dias));
  for (;;) {
    const w = d.getUTCDay();
    if (w >= 1 && w <= 5) {
      restantes -= 1;
      if (restantes === 0) return d.toISOString().slice(0, 10);
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

/**
 * Valida o dia de início pretendido e devolve o último dia coberto pelo pacote.
 * Regras: data válida, de segunda a sexta, dentro do período, não no passado e
 * o pacote tem de terminar até ao fim do programa.
 */
export function validarInicioPrograma(
  dia: string,
  periodo: { inicio: string; fim: string | null },
  diasPacote: number | null | undefined,
  hoje: string,
): { ok: boolean; erro?: string; fimPrevisto?: string | null } {
  if (!parseDia(dia)) return { ok: false, erro: 'Data de início inválida.' };
  if (!eDiaUtil(dia)) return { ok: false, erro: 'O programa decorre de segunda a sexta-feira. Escolha um dia útil para começar.' };
  if (dia < periodo.inicio) return { ok: false, erro: `O programa só começa a ${periodo.inicio}.` };
  if (periodo.fim && dia > periodo.fim) return { ok: false, erro: `O programa termina a ${periodo.fim}.` };
  if (dia < hoje) return { ok: false, erro: 'A data de início já passou.' };
  if (!diasPacote) return { ok: true, fimPrevisto: null };
  const fimPrevisto = somarDiasUteis(dia, diasPacote);
  if (periodo.fim && fimPrevisto > periodo.fim) {
    return { ok: false, erro: `Este pacote terminaria a ${fimPrevisto}, depois do fim do programa (${periodo.fim}). Escolha uma data mais cedo ou um pacote mais curto.` };
  }
  return { ok: true, fimPrevisto };
}

/** Os períodos [a1,a2] e [b1,b2] (dias inclusivos) sobrepõem-se? */
export function periodosSobrepostos(a1: string, a2: string, b1: string, b2: string): boolean {
  return a1 <= b2 && b1 <= a2;
}

/** Idade completa num dado dia. */
export function idadeEm(nascimento: string, dia: string): number | null {
  const n = parseDia(nascimento);
  const d = parseDia(dia);
  if (!n || !d) return null;
  let idade = d.getUTCFullYear() - n.getUTCFullYear();
  const m = d.getUTCMonth() - n.getUTCMonth();
  if (m < 0 || (m === 0 && d.getUTCDate() < n.getUTCDate())) idade -= 1;
  return idade;
}

// ─── Normalização / duplicados ─────────────────────────────────────────────

/** Telefone só com dígitos e '+' inicial; vazio → null. */
export function normalizarTelefone(v?: string | null): string | null {
  if (!v) return null;
  const t = String(v).trim();
  const digitos = t.replace(/[^\d]/g, '');
  if (!digitos) return null;
  return (t.startsWith('+') ? '+' : '') + digitos;
}

export function normalizarEmail(v?: string | null): string | null {
  const e = (v ?? '').trim().toLowerCase();
  return e || null;
}

export function normalizarNome(v?: string | null): string {
  return (v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export interface ParticipanteExistente {
  nome: string | null;
  contacto: string | null;
  email: string | null;
  estado: string;
}

/**
 * Considera duplicado o mesmo nome no mesmo evento com o mesmo telefone ou
 * email. O nome entra na chave porque irmãos partilham o contacto do encarregado.
 * Registos cancelados não bloqueiam uma nova pré-inscrição.
 */
export function eDuplicado(
  novo: { nome: string; contacto?: string | null; email?: string | null },
  existentes: ParticipanteExistente[],
): boolean {
  const nome = normalizarNome(novo.nome);
  const tel = normalizarTelefone(novo.contacto);
  const email = normalizarEmail(novo.email);
  return existentes.some((p) => {
    if (p.estado === 'CANCELADO') return false;
    if (normalizarNome(p.nome) !== nome) return false;
    const mesmoTel = !!tel && normalizarTelefone(p.contacto) === tel;
    const mesmoEmail = !!email && normalizarEmail(p.email) === email;
    return mesmoTel || mesmoEmail;
  });
}

/** Vagas ocupadas = participantes não cancelados. */
export function vagasDisponiveis(capacidade: number | null | undefined, ocupados: number): number | null {
  if (capacidade == null || capacidade <= 0) return null;
  return Math.max(0, capacidade - ocupados);
}

// ─── Estados ───────────────────────────────────────────────────────────────

export function isEstadoValido(e: string): e is EstadoParticipante {
  return (ESTADOS_PARTICIPANTE as readonly string[]).includes(e);
}

/** `presente` (legado) acompanha sempre o estado. */
export function presenteDoEstado(estado: EstadoParticipante): boolean {
  return estado === 'PRESENTE';
}

// ─── Exportação CSV ────────────────────────────────────────────────────────

function celulaCsv(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = v instanceof Date ? v.toISOString() : String(v);
  // Evita injecção de fórmulas ao abrir no Excel.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV com ';' (Excel PT) e BOM UTF-8. */
export function gerarCsv(cabecalho: string[], linhas: unknown[][]): string {
  const corpo = [cabecalho, ...linhas].map((l) => l.map(celulaCsv).join(';')).join('\r\n');
  return '﻿' + corpo + '\r\n';
}

// ─── Comunicação pós-evento ────────────────────────────────────────────────

export interface ConteudoComunicacao {
  titulo: string;
  mensagem: string;
  videoUrl?: string | null;
  galeriaUrl?: string | null;
  proximasActividades?: string | null;
  linkInscricao?: string | null;
}

/** Texto único usado no WhatsApp e no email, para o destinatário ver o mesmo conteúdo. */
export function comporMensagem(c: ConteudoComunicacao, nome?: string | null): string {
  const partes: string[] = [];
  const primeiroNome = (nome ?? '').trim().split(/\s+/)[0];
  partes.push(primeiroNome ? `Olá ${primeiroNome}! ${c.titulo}` : c.titulo);
  partes.push(c.mensagem.trim());
  if (c.videoUrl) partes.push(`🎥 Vídeo do evento: ${c.videoUrl}`);
  if (c.galeriaUrl) partes.push(`📸 Fotografias: ${c.galeriaUrl}`);
  if (c.proximasActividades?.trim()) partes.push(`📅 Próximas actividades:\n${c.proximasActividades.trim()}`);
  if (c.linkInscricao) partes.push(`🏊 Inscreva-se como atleta: ${c.linkInscricao}`);
  partes.push('— Mastchieve');
  return partes.join('\n\n');
}

export interface DestinatarioBase {
  participanteId: string;
  nome: string;
  telefone: string | null;
  email: string | null;
}

export type CanalEnvio = 'WHATSAPP' | 'EMAIL';

export interface PlanoEnvio {
  participanteId: string;
  nome: string;
  canal: CanalEnvio | 'NENHUM';
  destino: string | null;
}

/**
 * Para cada destinatário escolhe os canais pedidos que tenham contacto real.
 * Sem nenhum contacto utilizável → canal NENHUM (SEM_CONTACTO, nunca "recebido").
 * O mesmo telefone/email não recebe a mesma comunicação duas vezes.
 */
export function planearEnvios(destinatarios: DestinatarioBase[], canais: CanalEnvio[]): PlanoEnvio[] {
  const telefones = new Set<string>();
  const emails = new Set<string>();
  const plano: PlanoEnvio[] = [];
  for (const d of destinatarios) {
    const tel = normalizarTelefone(d.telefone);
    const email = normalizarEmail(d.email);
    const linhas: PlanoEnvio[] = [];
    let temContacto = false;
    if (canais.includes('WHATSAPP') && tel) {
      temContacto = true;
      if (!telefones.has(tel)) {
        telefones.add(tel);
        linhas.push({ participanteId: d.participanteId, nome: d.nome, canal: 'WHATSAPP', destino: tel });
      }
    }
    if (canais.includes('EMAIL') && email) {
      temContacto = true;
      if (!emails.has(email)) {
        emails.add(email);
        linhas.push({ participanteId: d.participanteId, nome: d.nome, canal: 'EMAIL', destino: email });
      }
    }
    if (!temContacto) linhas.push({ participanteId: d.participanteId, nome: d.nome, canal: 'NENHUM', destino: null });
    plano.push(...linhas);
  }
  return plano;
}

/** Aceita apenas http(s) — impede javascript: e afins nos links enviados. */
export function urlSegura(v?: string | null): string | null {
  const s = (v ?? '').trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}
