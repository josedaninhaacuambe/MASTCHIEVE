// Testes das regras puras de eventos públicos e presenças de convidados.
// Correr: npm run test:unit (node:test + ts-node, sem base de dados).
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  lerConfigFormulario, CAMPOS_INDIVIDUAL_OMISSAO, HORARIOS_ESCOLA_OMISSAO,
  normalizarTelefone, eDuplicado, vagasDisponiveis, isEstadoValido, presenteDoEstado,
  gerarCsv, comporMensagem, planearEnvios, urlSegura,
} from '../../src/modules/eventos/eventos-formulario.util';
import { validarConvidado, validarHorario, escolherTurmaOrigem } from '../../src/modules/attendance/attendance-convidado.util';

// ─── Presenças: convidados de outras turmas ─────────────────────────────────

test('convidado válido de outra turma é aceite', () => {
  assert.equal(validarConvidado({ atletaExiste: true, atletaAtivo: true, inscritoNaTurma: false, jaRegistadoNaAula: false }), null);
});

test('convidado não pode ser registado duas vezes na mesma aula', () => {
  assert.match(validarConvidado({ atletaExiste: true, atletaAtivo: true, inscritoNaTurma: false, jaRegistadoNaAula: true })!, /já tem presença/);
});

test('atleta da própria turma não entra como convidado', () => {
  assert.match(validarConvidado({ atletaExiste: true, atletaAtivo: true, inscritoNaTurma: true, jaRegistadoNaAula: false })!, /pertence a esta turma/);
});

test('atleta inexistente ou inactivo é rejeitado', () => {
  assert.ok(validarConvidado({ atletaExiste: false, atletaAtivo: false, inscritoNaTurma: false, jaRegistadoNaAula: false }));
  assert.ok(validarConvidado({ atletaExiste: true, atletaAtivo: false, inscritoNaTurma: false, jaRegistadoNaAula: false }));
});

test('hora de saída não pode ser anterior à entrada', () => {
  const e = new Date('2026-10-28T10:00:00Z');
  assert.equal(validarHorario(e, new Date('2026-10-28T11:00:00Z')), null);
  assert.ok(validarHorario(e, new Date('2026-10-28T09:00:00Z')));
  assert.ok(validarHorario(new Date('x'), null));
  assert.equal(validarHorario(null, null), null);
});

test('turma de origem: pedida válida, senão mesma unidade, senão a primeira', () => {
  const ins = [{ classId: 'A', unidadeId: 'U1' }, { classId: 'B', unidadeId: 'U2' }];
  assert.equal(escolherTurmaOrigem(ins, 'U2'), 'B');
  assert.equal(escolherTurmaOrigem(ins, 'U9'), 'A');
  assert.equal(escolherTurmaOrigem(ins, 'U2', 'A'), 'A');
  assert.equal(escolherTurmaOrigem(ins, 'U2', 'Z'), null);
  assert.equal(escolherTurmaOrigem([], 'U1'), null);
});

// ─── Formulário público ─────────────────────────────────────────────────────

test('configuração do formulário: omissão sem documento de identificação', () => {
  const c = lerConfigFormulario('INDIVIDUAL', null);
  assert.deepEqual(c.campos, CAMPOS_INDIVIDUAL_OMISSAO);
  assert.ok(!c.campos.includes('documentoIdentificacao'));
});

test('configuração do formulário ignora campos desconhecidos e JSON inválido', () => {
  assert.deepEqual(lerConfigFormulario('INDIVIDUAL', JSON.stringify({ campos: ['email', 'senhaAdmin'] })).campos, ['email']);
  assert.deepEqual(lerConfigFormulario('INDIVIDUAL', '{partido').campos, CAMPOS_INDIVIDUAL_OMISSAO);
  const escola = lerConfigFormulario('ESCOLA', null);
  assert.deepEqual(escola, { campos: [], horarios: HORARIOS_ESCOLA_OMISSAO });
});

test('pré-inscrição duplicada: mesmo nome + mesmo contacto', () => {
  const existentes = [{ nome: 'João  Silva', contacto: '+258 84 123 4567', email: null, estado: 'PRE_INSCRITO' }];
  assert.ok(eDuplicado({ nome: 'joao silva', contacto: '+258841234567' }, existentes));
  // irmão com o mesmo contacto do encarregado não é duplicado
  assert.ok(!eDuplicado({ nome: 'Maria Silva', contacto: '+258841234567' }, existentes));
  // registo cancelado não bloqueia nova inscrição
  assert.ok(!eDuplicado({ nome: 'João Silva', contacto: '+258841234567' }, [{ ...existentes[0], estado: 'CANCELADO' }]));
});

test('capacidade do evento', () => {
  assert.equal(vagasDisponiveis(10, 7), 3);
  assert.equal(vagasDisponiveis(10, 12), 0);
  assert.equal(vagasDisponiveis(null, 99), null);
});

test('estados: só os cinco previstos; preencher formulário não marca presença', () => {
  for (const e of ['PRE_INSCRITO', 'CONFIRMADO', 'PRESENTE', 'AUSENTE', 'CANCELADO']) assert.ok(isEstadoValido(e));
  assert.ok(!isEstadoValido('INSCRITO'));
  assert.equal(presenteDoEstado('PRE_INSCRITO'), false);
  assert.equal(presenteDoEstado('PRESENTE'), true);
});

test('exportação CSV escapa separadores e neutraliza fórmulas', () => {
  const csv = gerarCsv(['Nome', 'Nota'], [['Ana; Lda', '=HYPERLINK("x")'], [null, 'ok']]);
  assert.ok(csv.startsWith('﻿'));
  assert.ok(csv.includes('"Ana; Lda"'));
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
});

// ─── Comunicação pós-evento ─────────────────────────────────────────────────

test('mensagem inclui vídeo, fotografias, próximas actividades e link de inscrição', () => {
  const m = comporMensagem({
    titulo: 'Obrigado pelo Open Day', mensagem: 'Foi um dia fantástico.',
    videoUrl: 'https://v.example/1', galeriaUrl: 'https://g.example/1',
    proximasActividades: 'Open Day 3 — 15/11', linkInscricao: 'https://app.example/evento/abc',
  }, 'Ana Maria');
  assert.ok(m.startsWith('Olá Ana!'));
  for (const s of ['https://v.example/1', 'https://g.example/1', 'Open Day 3', 'https://app.example/evento/abc']) assert.ok(m.includes(s));
});

test('sem contacto → NENHUM; contactos não são inventados nem repetidos', () => {
  const plano = planearEnvios([
    { participanteId: '1', nome: 'A', telefone: '+258 84 000 0001', email: 'a@x.com' },
    { participanteId: '2', nome: 'B (irmão)', telefone: '+258840000001', email: null },
    { participanteId: '3', nome: 'C (walk-in)', telefone: null, email: null },
  ], ['WHATSAPP', 'EMAIL']);
  assert.deepEqual(plano.map((p) => [p.participanteId, p.canal]), [['1', 'WHATSAPP'], ['1', 'EMAIL'], ['3', 'NENHUM']]);
  assert.equal(plano.find((p) => p.participanteId === '3')!.destino, null);
});

test('só canais pedidos são usados', () => {
  const plano = planearEnvios([{ participanteId: '1', nome: 'A', telefone: null, email: 'a@x.com' }], ['WHATSAPP']);
  assert.deepEqual(plano.map((p) => p.canal), ['NENHUM']);
});

test('links da comunicação: só http(s)', () => {
  assert.equal(urlSegura('javascript:alert(1)'), null);
  assert.equal(urlSegura('ftp://x'), null);
  assert.equal(urlSegura('https://youtu.be/abc'), 'https://youtu.be/abc');
  assert.equal(urlSegura('  '), null);
  assert.equal(normalizarTelefone('  '), null);
});
