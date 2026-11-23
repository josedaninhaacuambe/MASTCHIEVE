import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import {
  TURNOS_PADRAO, turnoDaAula, ordenarTurnos, parseDataRelatorio, idadeNaData, diaDaSemana,
  gerarExcelRelatorioDiario, tituloRelatorio, LinhaRelatorio,
} from '../../src/modules/attendance/relatorio-diario.util';
import {
  gerarTokenConvite, hashTokenConvite, tokenConviteValido, emailGeradoAutomaticamente,
} from '../../src/common/utils/convite-acesso.util';

test('turnos fixos vão das 05:30 às 16:30, em blocos de 50 minutos', () => {
  assert.equal(TURNOS_PADRAO.length, 12);
  assert.equal(TURNOS_PADRAO[0], '05:30-06:20');
  assert.equal(TURNOS_PADRAO[11], '16:30-17:20');
});

test('aula é colocada no turno fixo pela hora de início', () => {
  assert.equal(turnoDaAula('7:30', '08:20'), '07:30-08:20');
  assert.equal(turnoDaAula('07:30', '09:00'), '07:30-08:20');
  assert.equal(turnoDaAula('18:00', '18:50'), '18:00-18:50');
  assert.equal(turnoDaAula('', ''), 'Sem horário');
});

test('ordenarTurnos mantém os turnos vazios e ordena atletas por nome', () => {
  const l = (nome: string): LinhaRelatorio => ({ nome, trabalhadorBm: '', contacto: '', modulo: '', idade: 10 });
  const mapa = new Map([['07:30-08:20', [l('Zeca'), l('Ana')]], ['18:00-18:50', [l('Rui')]]]);
  const t = ordenarTurnos(mapa);
  assert.equal(t.length, 13);
  assert.deepEqual(t.find((x) => x.turno === '07:30-08:20')!.atletas.map((a) => a.nome), ['Ana', 'Zeca']);
  assert.equal(t[t.length - 1].turno, '18:00-18:50');
  assert.equal(t[0].atletas.length, 0);
});

test('parseDataRelatorio rejeita datas inválidas', () => {
  assert.equal(parseDataRelatorio('2026-02-30'), null);
  assert.equal(parseDataRelatorio('23/11/2026'), null);
  assert.equal(parseDataRelatorio(undefined), null);
  const d = parseDataRelatorio('2026-11-23')!;
  assert.equal(diaDaSemana(d), 'Segunda-feira');
});

test('idade calculada na data do relatório', () => {
  const ref = new Date(2026, 10, 23);
  assert.equal(idadeNaData(new Date(2016, 10, 23), ref), 10);
  assert.equal(idadeNaData(new Date(2016, 10, 24), ref), 9);
});

test('Excel tem título, cabeçalhos do modelo e uma linha por atleta', () => {
  const data = parseDataRelatorio('2026-11-23')!;
  const turnos = ordenarTurnos(new Map([['05:30-06:20', [{ nome: 'Ana Silva', trabalhadorBm: 'Sim', contacto: '', modulo: 'Estrela-do-Mar', idade: 8 }]]]));
  const buf = gerarExcelRelatorioDiario({ titulo: tituloRelatorio(data), data, unidade: 'CCBM', turnos });
  const ws = XLSX.read(buf, { type: 'buffer' }).Sheets['Presenças'];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  assert.match(String(rows[0][0]), /PRESENÇAS DIÁRIAS DAS AULAS DO PROJETO 1C1N - NOVEMBRO DE 2026/);
  assert.equal(rows[1][1], 'Segunda-feira');
  assert.deepEqual(rows[4].slice(0, 6), ['Ord', 'Nome e Apelido', 'Trabalhador do BM', 'Contacto', 'Módulo', 'Idade']);
  assert.deepEqual(rows[5].slice(0, 6), [1, 'Ana Silva', 'Sim', '', 'Estrela-do-Mar', 8]);
  // Contacto em falta fica vazio, nunca inventado.
  assert.equal(rows[5][3], '');
});

test('convite: token aleatório de 64 hex e só o hash é comparável', () => {
  const a = gerarTokenConvite();
  const b = gerarTokenConvite();
  assert.ok(tokenConviteValido(a.token));
  assert.notEqual(a.token, b.token);
  assert.equal(hashTokenConvite(a.token), a.tokenHash);
  assert.notEqual(a.tokenHash, a.token);
  assert.equal(tokenConviteValido('abc'), false);
  assert.equal(tokenConviteValido("' OR 1=1 --"), false);
});

test('emails gerados automaticamente são reconhecidos', () => {
  assert.ok(emailGeradoAutomaticamente('atleta_1732_ab12cd34@mastchieve.com'));
  assert.ok(emailGeradoAutomaticamente('encarregado_1732_0_ab12cd34@mastchieve.com'));
  assert.equal(emailGeradoAutomaticamente('maria@gmail.com'), false);
});
