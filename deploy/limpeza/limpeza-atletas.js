// @ts-check
'use strict';
/**
 * Limpeza de atletas de teste na base de dados de produção.
 *
 * Fase 1 — relatório (só leitura, não altera nada):
 *   node limpeza-atletas.js relatorio
 *   → /limpeza/atletas.csv, /limpeza/ids-a-remover.txt, /limpeza/contas.csv, /limpeza/resumo.txt
 *
 * Fase 2 — remoção dos IDs que ficaram activos (sem #) em ids-a-remover.txt:
 *   node limpeza-atletas.js remover /limpeza/ids-a-remover.txt --autor=email@admin            (simulação)
 *   node limpeza-atletas.js remover /limpeza/ids-a-remover.txt --autor=email@admin \
 *        --backup=/limpeza/backup.sql --confirmar                                            (remove)
 *
 * Regra: mantém-se sempre quem foi cadastrado por um ASSISTENTE_ADMIN (registo STUDENT_CRIADO).
 * Só os dados de teste reconhecidos (nomes/emails do seed) ficam marcados para remoção; os restantes
 * (sem autor, importados por administradores, auto-registos) vão para revisão manual, comentados.
 */
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

// O script corre fora da pasta da API; o Prisma Client é carregado a partir dela.
const requireApi = createRequire(path.join(process.cwd(), 'package.json'));
/** @type {typeof import('@prisma/client')} */
const { PrismaClient } = requireApi('@prisma/client');
const prisma = new PrismaClient();

const PASTA = process.env.PASTA_LIMPEZA || '/limpeza';
// Margem conservadora: inclui o tempo até o registo de autor chegar à produção.
const INICIO_AUDITORIA = new Date(process.env.INICIO_AUDITORIA || '2026-08-28T00:00:00Z');

// Nomes e contas criados pelos scripts de dados de teste (prisma/seed*.ts|js)
const normalizar = (/** @type {string} */ t) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const NOMES_SEED = new Set([
  'Ana Mendes', 'Andre Pereira', 'Beatriz Almeida', 'Carolina Lopes', 'Catarina Gomes', 'Diogo Neves',
  'Francisco Sousa', 'Goncalo Ribeiro', 'Ines Carvalho', 'Joana Castro', 'Leonor Martins',
  'Madalena Azevedo', 'Mariana Lima', 'Mateus Oliveira', 'Miguel Pinto', 'Rafael Teixeira',
  'Ricardo Mendonca', 'Rodrigo Faria', 'Sofia Ferreira', 'Tomas Araujo', 'Tomas Rodrigues',
].map(normalizar));
const EMAILS_SEED = new Set([
  'admin@mastchieve.com', 'joao.silva@mastchieve.com', 'maria.santos@mastchieve.com', 'pedro.costa@mastchieve.com',
  'ana.instrutora@mastchieve.co.mz', 'bruno.salvavidas@mastchieve.co.mz', 'carla.recepcao@mastchieve.co.mz',
  'duarte.coordenador@mastchieve.co.mz', 'emanuel.instrutor.bloqueado@mastchieve.co.mz',
  'gestorrh@mastchieve.co.mz', 'superadmin@mastchieve.co.mz',
  'helena.c@example.com', 'ricardo.m@example.com', 'sofia.n@example.com',
]);
const emailDeSeed = (/** @type {string | null | undefined} */ e) =>
  !!e && (EMAILS_SEED.has(e.toLowerCase()) || /@(email|example)\.com$/i.test(e));

const data = (/** @type {Date | null | undefined} */ d) => (d ? d.toISOString().slice(0, 16).replace('T', ' ') : '');
const celula = (/** @type {unknown} */ v) => {
  let t = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`; // impede fórmulas ao abrir no Excel
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
const escreverCsv = (/** @type {string} */ ficheiro, /** @type {string[]} */ cabecalho, /** @type {unknown[][]} */ linhas) =>
  fs.writeFileSync(path.join(PASTA, ficheiro), '﻿' + [cabecalho, ...linhas].map((l) => l.map(celula).join(';')).join('\n'), { mode: 0o600 });

async function classificar() {
  const atletas = await prisma.student.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, firstName: true, lastName: true, dateOfBirth: true, createdAt: true, isActive: true,
      unidade: { select: { nome: true } },
      user: { select: { id: true, email: true, role: true, lastLoginAt: true } },
      parents: { select: { parent: { select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } } } } },
      _count: {
        select: {
          enrollments: true, attendances: true, payments: true, documents: true,
          registosEntradaSaida: true, eventoParticipacoes: true,
        },
      },
    },
  });

  const criacoes = await prisma.auditLog.findMany({
    where: { action: 'STUDENT_CRIADO', entity: 'Student' },
    select: { entityId: true, createdAt: true, user: { select: { email: true, role: true } } },
  });
  const autorDe = new Map(criacoes.map((c) => [c.entityId, c]));

  // Qualquer acção de um assistente sobre o atleta sugere que é real.
  const tocados = new Set();
  const acoes = await prisma.auditLog.findMany({
    where: { entity: 'Student', user: { role: 'ASSISTENTE_ADMIN' } }, select: { entityId: true }, distinct: ['entityId'],
  });
  acoes.forEach((a) => tocados.add(a.entityId));
  const registos = await prisma.registoEntradaSaidaAluno.findMany({
    where: { registadoPor: { role: 'ASSISTENTE_ADMIN' } }, select: { studentId: true }, distinct: ['studentId'],
  });
  registos.forEach((r) => tocados.add(r.studentId));

  const pagos = await prisma.payment.groupBy({ by: ['studentId'], where: { status: 'PAID' }, _count: { _all: true }, _sum: { amount: true } });
  const pagosDe = new Map(pagos.map((p) => [p.studentId, p]));

  return atletas.map((s) => {
    const autor = autorDe.get(s.id);
    const pago = pagosDe.get(s.id);
    const seed = NOMES_SEED.has(normalizar(`${s.firstName} ${s.lastName}`))
      || s.parents.some((p) => emailDeSeed(p.parent.user?.email));
    const alertas = [];
    if (!autor && s.createdAt < INICIO_AUDITORIA) alertas.push('SEM_AUTOR_ANTERIOR_AUDITORIA');
    if (!autor && s.createdAt >= INICIO_AUDITORIA) alertas.push('SEM_AUTOR_AUTO_REGISTO');
    if (autor && autor.user.role !== 'ASSISTENTE_ADMIN') alertas.push(`CRIADO_POR_${autor.user.role}`);
    if (pago) alertas.push('PAGAMENTOS_PAGOS');
    if (tocados.has(s.id)) alertas.push('ACTIVIDADE_DE_ASSISTENTE');
    if (seed) alertas.push('DADOS_DE_TESTE_SEED');

    let decisao;
    if (autor?.user.role === 'ASSISTENTE_ADMIN') decisao = 'MANTER';
    else if (!seed) decisao = 'REVER'; // importações de administradores e auto-registos podem ser atletas reais
    // Dados do seed dispensam os alertas de data e pagamentos, mas nunca a actividade de um assistente.
    else decisao = alertas.includes('ACTIVIDADE_DE_ASSISTENTE') ? 'REVER' : 'REMOVER';
    return { s, autor, pago, alertas, decisao };
  });
}

async function relatorio() {
  fs.mkdirSync(PASTA, { recursive: true, mode: 0o700 });
  const linhas = await classificar();

  escreverCsv('atletas.csv',
    ['decisao', 'alertas', 'id', 'nome', 'nascimento', 'unidade', 'activo', 'criado_em', 'criado_por', 'perfil_autor',
      'email_conta', 'ultimo_login', 'encarregados', 'turmas', 'presencas', 'pagamentos', 'pagos_valor', 'documentos', 'entradas_saidas', 'eventos'],
    linhas.map(({ s, autor, pago, alertas, decisao }) => [
      decisao, alertas.join(' '), s.id, `${s.firstName} ${s.lastName}`, data(s.dateOfBirth).slice(0, 10), s.unidade?.nome,
      s.isActive ? 'sim' : 'nao', data(s.createdAt), autor?.user.email, autor?.user.role, s.user?.email, data(s.user?.lastLoginAt),
      s.parents.map((p) => `${p.parent.firstName} ${p.parent.lastName} <${p.parent.user?.email ?? ''}>`).join(', '),
      s._count.enrollments, s._count.attendances, s._count.payments, pago?._sum.amount ?? 0, s._count.documents,
      s._count.registosEntradaSaida, s._count.eventoParticipacoes,
    ]));

  const ids = linhas.filter((l) => l.decisao !== 'MANTER').map(({ s, alertas, decisao }) =>
    `${decisao === 'REMOVER' ? '' : '# '}${s.id}  # ${s.firstName} ${s.lastName} | criado ${data(s.createdAt)} | ${decisao} ${alertas.join(' ')}`);
  fs.writeFileSync(path.join(PASTA, 'ids-a-remover.txt'), [
    '# Um ID por linha. Só são removidas as linhas que NÃO começam por #.',
    '# Linhas REVER estão comentadas: retira o # do início só depois de confirmar que o atleta é de teste.',
    '# Para manter um atleta marcado REMOVER, põe # no início da linha.',
    ...ids, '',
  ].join('\n'), { mode: 0o600 });

  // Outros dados: só listagem, para decidir à parte o que é fictício.
  const contas = await prisma.user.findMany({
    where: { role: { notIn: ['STUDENT'] } },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true,
      instructor: { select: { firstName: true, lastName: true } }, parent: { select: { firstName: true, lastName: true } },
      funcionario: { select: { id: true } },
    },
  });
  escreverCsv('contas.csv', ['perfil', 'email', 'nome', 'activa', 'ultimo_login', 'criada_em', 'funcionario_rh', 'conta_de_teste_seed', 'id'],
    contas.map((u) => {
      const p = u.instructor ?? u.parent;
      return [u.role, u.email, p ? `${p.firstName} ${p.lastName}` : '', u.isActive ? 'sim' : 'nao', data(u.lastLoginAt),
        data(u.createdAt), u.funcionario ? 'sim' : 'nao', emailDeSeed(u.email) ? 'sim' : '', u.id];
    }));

  const conta = (/** @type {string} */ d) => linhas.filter((l) => l.decisao === d).length;
  // Lotes: atletas REVER criados pelo mesmo autor na mesma hora (ex.: uma importação de ficheiro).
  const lotes = new Map();
  for (const { s, autor, alertas, decisao } of linhas) {
    if (decisao !== 'REVER') continue;
    const chave = `${data(s.createdAt).slice(0, 13)}h | ${autor ? `${autor.user.email} (${autor.user.role})` : 'sem autor'}`;
    const lote = lotes.get(chave) ?? { total: 0, comActividade: 0, exemplos: [] };
    lote.total++;
    if (alertas.includes('ACTIVIDADE_DE_ASSISTENTE') || alertas.includes('PAGAMENTOS_PAGOS')) lote.comActividade++;
    if (lote.exemplos.length < 3) lote.exemplos.push(`${s.firstName} ${s.lastName}`);
    lotes.set(chave, lote);
  }
  const resumo = [
    `Relatório gerado em ${new Date().toISOString()}`,
    `Atletas: ${linhas.length}`,
    `  MANTER  (cadastrados por assistente administrativo): ${conta('MANTER')}`,
    `  REMOVER (marcados no ficheiro de IDs):                ${conta('REMOVER')}`,
    `  REVER   (comentados no ficheiro; podem ser reais):    ${conta('REVER')}`,
    `Contas que não são de atleta: ${contas.length} (seed/teste: ${contas.filter((u) => emailDeSeed(u.email)).length}) — ver contas.csv; este script não as remove.`,
    `Totais: turmas ${await prisma.class.count()}, encarregados ${await prisma.parent.count()}, instrutores ${await prisma.instructor.count()},`
      + ` pagamentos ${await prisma.payment.count()}, eventos ${await prisma.evento.count()}, leads ${await prisma.lead.count()}`,
    '',
    'Atletas REVER por lote (criados por / hora) — com actividade = pagamentos pagos ou trabalho de assistente:',
    ...[...lotes].map(([chave, l]) => `  ${chave}: ${l.total} atleta(s), ${l.comActividade} com actividade — ex.: ${l.exemplos.join(', ')}`),
  ].join('\n');
  fs.writeFileSync(path.join(PASTA, 'resumo.txt'), resumo + '\n', { mode: 0o600 });
  console.log(resumo);
  console.log(`\nFicheiros em ${PASTA}: atletas.csv, ids-a-remover.txt, contas.csv, resumo.txt`);
}

/** @param {string} ficheiro @param {{ confirmar: boolean, autorEmail?: string, backup?: string }} opcoes */
async function remover(ficheiro, { confirmar, autorEmail, backup }) {
  if (!ficheiro || !fs.existsSync(ficheiro)) throw new Error(`Ficheiro de IDs não encontrado: ${ficheiro}`);
  const pedidos = [...new Set(fs.readFileSync(ficheiro, 'utf8').split(/\r?\n/)
    .map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/)[0]))];
  if (!pedidos.length) throw new Error('Nenhum ID activo no ficheiro.');

  const autor = autorEmail ? await prisma.user.findUnique({ where: { email: autorEmail.toLowerCase() } }) : null;
  if (!autor || !['ADMIN', 'SUPER_ADMIN'].includes(autor.role)) {
    const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true }, select: { email: true, role: true } });
    throw new Error('Indica --autor=<email de uma conta ADMIN ou SUPER_ADMIN> para ficar registado quem fez a limpeza.\n'
      + `Contas possíveis:\n${admins.map((a) => `  ${a.email} (${a.role})`).join('\n')}`);
  }

  // Classificação refeita agora: nunca se remove quem entretanto foi associado a um assistente.
  const porId = new Map((await classificar()).map((l) => [l.s.id, l]));
  const alvos = [];
  for (const id of pedidos) {
    const l = porId.get(id);
    if (!l) console.log(`  ignorado (não existe): ${id}`);
    else if (l.decisao === 'MANTER') console.log(`  RECUSADO (cadastrado por assistente): ${id} ${l.s.firstName} ${l.s.lastName}`);
    else alvos.push(l);
  }
  const revistos = alvos.filter((l) => l.decisao === 'REVER').length;
  console.log(`\nA remover: ${alvos.length} atleta(s), dos quais ${revistos} estavam em REVER e foram activados à mão.`);
  console.log('Apaga também turmas, presenças, pagamentos, documentos, avaliações e entradas/saídas desses atletas,');
  console.log('a conta de login de cada um e os encarregados que fiquem sem nenhum atleta.');

  if (!confirmar) {
    alvos.forEach(({ s, alertas }) => console.log(`  ${s.id}  ${s.firstName} ${s.lastName}  ${alertas.join(' ')}`));
    console.log('\nSIMULAÇÃO — nada foi alterado. Para remover, repete com --backup=<ficheiro> --confirmar');
    return;
  }

  if (!backup || !fs.existsSync(backup)) throw new Error('Indica --backup=<ficheiro .sql> com a cópia de segurança feita antes da limpeza.');
  const b = fs.statSync(backup);
  if (b.size < 10_000 || Date.now() - b.mtimeMs > 6 * 3600_000) throw new Error('O backup indicado está vazio ou tem mais de 6 horas. Faz um novo.');

  const resultado = { atletas: /** @type {string[]} */ ([]), contas: /** @type {string[]} */ ([]), contasDesactivadas: /** @type {string[]} */ ([]), erros: /** @type {string[]} */ ([]) };
  const encarregados = new Set();

  /** Apaga a conta; se outros registos a referirem, desactiva-a em vez de falhar. */
  const removerConta = async (/** @type {string} */ userId, /** @type {string} */ email) => {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, student: { select: { id: true } }, parent: { select: { id: true } }, instructor: { select: { id: true } }, admin: { select: { id: true } }, funcionario: { select: { id: true } } },
    });
    if (!u || !['STUDENT', 'PARENT', 'VISITOR'].includes(u.role) || u.student || u.instructor || u.admin || u.funcionario) return;
    if (u.parent && (await prisma.studentParent.count({ where: { parentId: u.parent.id } })) > 0) return;
    try {
      await prisma.user.delete({ where: { id: userId } });
      resultado.contas.push(email);
    } catch {
      await prisma.user.update({ where: { id: userId }, data: { isActive: false, refreshToken: null } });
      resultado.contasDesactivadas.push(email);
    }
  };

  for (const { s, alertas } of alvos) {
    try {
      s.parents.forEach((p) => encarregados.add(p.parent.id));
      await prisma.$transaction([
        prisma.eventoParticipante.deleteMany({ where: { studentId: s.id } }),
        prisma.student.delete({ where: { id: s.id } }),
        prisma.auditLog.create({
          data: {
            userId: autor.id, action: 'ATLETA_REMOVIDO_LIMPEZA', entity: 'Student', entityId: s.id,
            oldValues: JSON.stringify({ firstName: s.firstName, lastName: s.lastName, unidade: s.unidade?.nome, alertas }),
          },
        }),
      ]);
      resultado.atletas.push(`${s.id} ${s.firstName} ${s.lastName}`);
      if (s.user) await removerConta(s.user.id, s.user.email);
    } catch (e) {
      resultado.erros.push(`${s.id} ${s.firstName} ${s.lastName}: ${e instanceof Error ? e.message.split('\n').pop() : e}`);
    }
  }

  for (const parentId of encarregados) {
    const p = await prisma.parent.findUnique({ where: { id: parentId }, select: { userId: true, user: { select: { email: true } } } });
    if (p) await removerConta(p.userId, p.user.email).catch((e) => resultado.erros.push(`encarregado ${p.user.email}: ${e.message}`));
  }

  const saida = path.join(path.dirname(ficheiro), `remocao-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(saida, JSON.stringify(resultado, null, 2), { mode: 0o600 });
  console.log(`\nRemovidos: ${resultado.atletas.length} atleta(s), ${resultado.contas.length} conta(s);`
    + ` ${resultado.contasDesactivadas.length} conta(s) desactivada(s) por terem histórico; ${resultado.erros.length} erro(s).`);
  resultado.erros.forEach((e) => console.log(`  ERRO ${e}`));
  console.log(`Detalhe: ${saida}`);
}

async function main() {
  const [modo, ficheiro, ...resto] = process.argv.slice(2);
  const opcao = (/** @type {string} */ n) => resto.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
  if (modo === 'relatorio') await relatorio();
  else if (modo === 'remover') await remover(ficheiro, { confirmar: resto.includes('--confirmar'), autorEmail: opcao('autor'), backup: opcao('backup') });
  else console.log('Uso: node limpeza-atletas.js relatorio | remover <ficheiro> --autor=<email> [--backup=<ficheiro> --confirmar]');
}

main()
  .catch((e) => { console.error(`\nERRO: ${e instanceof Error ? e.message : e}`); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
