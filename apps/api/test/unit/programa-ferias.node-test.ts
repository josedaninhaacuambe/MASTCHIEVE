// Regras puras do programa de férias nos Eventos (período, pacotes, vagas) e do DTO público.
// Correr: npm run test:unit (node:test + ts-node, sem base de dados).
import 'reflect-metadata';
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  diaLocal, eDiaUtil, somarDiasUteis, validarInicioPrograma, periodosSobrepostos, idadeEm, lerConfigFormulario,
  FORMULARIO_TIPOS,
} from '../../src/modules/eventos/eventos-formulario.util';
import { InscricaoProgramaDto, PacoteEventoDto } from '../../src/modules/eventos/dto/eventos.dto';

const PERIODO = { inicio: '2026-11-23', fim: '2027-02-01' }; // "Mergulha nas Férias"

test('diaLocal usa o dia de Moçambique (UTC+2), não o do servidor', () => {
  // 23/11 00:00 em Maputo = 22/11 22:00 UTC
  assert.equal(diaLocal(new Date('2026-11-22T22:00:00.000Z')), '2026-11-23');
  assert.equal(diaLocal(new Date('2026-11-23T21:59:00.000Z')), '2026-11-23');
});

test('dias úteis: segunda a sexta e soma de pacotes', () => {
  assert.equal(eDiaUtil('2026-11-23'), true); // segunda
  assert.equal(eDiaUtil('2026-11-28'), false); // sábado
  assert.equal(eDiaUtil('2026-02-30'), false);
  assert.equal(somarDiasUteis('2026-11-23', 1), '2026-11-23'); // diário
  assert.equal(somarDiasUteis('2026-11-23', 5), '2026-11-27'); // semanal
  assert.equal(somarDiasUteis('2026-11-26', 5), '2026-12-02'); // salta o fim-de-semana
  assert.equal(somarDiasUteis('2026-11-23', 10), '2026-12-04'); // quinzenal
});

test('validarInicioPrograma aplica período, dia útil, passado e fim do pacote', () => {
  const hoje = '2026-11-22';
  assert.deepEqual(validarInicioPrograma('2026-11-23', PERIODO, 5, hoje), { ok: true, fimPrevisto: '2026-11-27' });
  assert.equal(validarInicioPrograma('2026-11-28', PERIODO, 1, hoje).ok, false); // sábado
  assert.equal(validarInicioPrograma('2026-11-20', PERIODO, 1, hoje).ok, false); // antes do início
  assert.equal(validarInicioPrograma('2027-02-02', PERIODO, 1, hoje).ok, false); // depois do fim
  assert.equal(validarInicioPrograma('2026-11-24', PERIODO, 1, '2026-11-25').ok, false); // já passou
  const mensal = validarInicioPrograma('2027-01-25', PERIODO, 20, hoje);
  assert.equal(mensal.ok, false);
  assert.match(mensal.erro!, /depois do fim do programa/);
  assert.deepEqual(validarInicioPrograma('2027-02-01', PERIODO, 1, hoje), { ok: true, fimPrevisto: '2027-02-01' });
  assert.deepEqual(validarInicioPrograma('2026-12-01', PERIODO, null, hoje), { ok: true, fimPrevisto: null });
});

test('periodosSobrepostos e idadeEm', () => {
  assert.equal(periodosSobrepostos('2026-11-23', '2026-11-27', '2026-11-27', '2026-12-03'), true);
  assert.equal(periodosSobrepostos('2026-11-23', '2026-11-27', '2026-11-30', '2026-12-04'), false);
  assert.equal(idadeEm('2016-11-23', '2026-11-22'), 9);
  assert.equal(idadeEm('2016-11-22', '2026-11-22'), 10);
  assert.equal(idadeEm('x', '2026-11-22'), null);
});

test('formulário PROGRAMA não tem campos configuráveis', () => {
  assert.ok((FORMULARIO_TIPOS as readonly string[]).includes('PROGRAMA'));
  assert.deepEqual(lerConfigFormulario('PROGRAMA', '{"campos":["email"],"horarios":["x"]}'), { campos: [], horarios: [] });
});

test('InscricaoProgramaDto exige criança, encarregado, contacto, pacote e datas; honeypot vazio', () => {
  const ok = plainToInstance(InscricaoProgramaDto, {
    nomeCrianca: ' Ana Maria ', dataNascimento: '2016-05-20', nomeEncarregado: 'Carlos Maria', contacto: '+258 84 123 4567',
    pacoteId: '3f1c2a7e-8b4d-4c1a-9e2f-1a2b3c4d5e6f', dataInicio: '2026-11-23', declaracao: true, email: '', website: '',
  });
  assert.equal(validateSync(ok).length, 0);
  assert.equal(ok.nomeCrianca, 'Ana Maria');
  assert.equal(ok.email, undefined);
  const mau = plainToInstance(InscricaoProgramaDto, {
    nomeCrianca: 'A', dataNascimento: '20/05/2016', nomeEncarregado: 'C', contacto: 'abc', pacoteId: 'x',
    dataInicio: '', declaracao: true, website: 'spam',
  });
  const props = validateSync(mau).map((e) => e.property).sort();
  assert.deepEqual(props, ['contacto', 'dataInicio', 'dataNascimento', 'nomeCrianca', 'nomeEncarregado', 'pacoteId', 'website']);
});

test('PacoteEventoDto: preço não negativo e dias inteiros', () => {
  assert.equal(validateSync(plainToInstance(PacoteEventoDto, { nome: 'Semanal', preco: 1750, dias: 5 })).length, 0);
  assert.ok(validateSync(plainToInstance(PacoteEventoDto, { nome: 'Semanal', preco: -1 })).length > 0);
  assert.ok(validateSync(plainToInstance(PacoteEventoDto, { nome: 'Semanal', preco: 10, dias: 0 })).length > 0);
});
