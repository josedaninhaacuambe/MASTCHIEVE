// Regras da gestão de inscrições em formações (vagas, estados, validação dos pedidos).
// Correr: npm run test:unit (node:test + ts-node, sem base de dados).
import 'reflect-metadata';
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  ocupaVaga,
  formacaoAceitaInscricoes,
  resumoVagas,
  contagemPorEstado,
} from '../../src/modules/recursos-humanos/formacao/inscricoes.rules';
import {
  InscreverFormacaoDto,
  ActualizarInscricaoDto,
  CancelarInscricaoDto,
  DefinirVagasDto,
} from '../../src/modules/recursos-humanos/formacao/dto/inscrever-formacao.dto';
import { CreateFormacaoDto } from '../../src/modules/recursos-humanos/formacao/dto/create-formacao.dto';

const UUID = '3f1c2a7e-8b4d-4c1a-9e2f-1a2b3c4d5e6f';
const erros = (cls: any, obj: any) => validateSync(plainToInstance(cls, obj)).map((e) => e.property).sort();

test('só inscrições activas ou concluídas ocupam vaga', () => {
  assert.equal(ocupaVaga('INSCRITO'), true);
  assert.equal(ocupaVaga('CONCLUIDO'), true);
  assert.equal(ocupaVaga('DESISTIU'), false);
  assert.equal(ocupaVaga('CANCELADA'), false);
});

test('só formações aprovadas ou em curso aceitam inscrições', () => {
  assert.equal(formacaoAceitaInscricoes('APROVADA_ORCAMENTO'), true);
  assert.equal(formacaoAceitaInscricoes('EM_CURSO'), true);
  for (const e of ['PROPOSTA', 'REJEITADA', 'CONCLUIDA', 'CANCELADA']) assert.equal(formacaoAceitaInscricoes(e), false);
});

test('resumoVagas calcula disponíveis e esgotada; sem limite nunca esgota', () => {
  const estados = ['INSCRITO', 'CONCLUIDO', 'CANCELADA', 'DESISTIU'];
  assert.deepEqual(resumoVagas(3, estados), { vagas: 3, ocupadas: 2, disponiveis: 1, esgotada: false });
  assert.deepEqual(resumoVagas(2, estados), { vagas: 2, ocupadas: 2, disponiveis: 0, esgotada: true });
  // Capacidade reduzida abaixo do ocupado (dados antigos) não dá negativo.
  assert.deepEqual(resumoVagas(1, estados), { vagas: 1, ocupadas: 2, disponiveis: 0, esgotada: true });
  assert.deepEqual(resumoVagas(null, estados), { vagas: null, ocupadas: 2, disponiveis: null, esgotada: false });
});

test('contagemPorEstado inclui sempre os quatro estados', () => {
  assert.deepEqual(contagemPorEstado([]), { INSCRITO: 0, CONCLUIDO: 0, DESISTIU: 0, CANCELADA: 0 });
  assert.deepEqual(contagemPorEstado(['INSCRITO', 'INSCRITO', 'CANCELADA']), { INSCRITO: 2, CONCLUIDO: 0, DESISTIU: 0, CANCELADA: 1 });
});

test('DTOs de inscrição validam id, estado, motivo e vagas', () => {
  assert.deepEqual(erros(InscreverFormacaoDto, { funcionarioId: UUID, observacoes: 'turno da manhã' }), []);
  assert.deepEqual(erros(InscreverFormacaoDto, { funcionarioId: '1 OR 1=1' }), ['funcionarioId']);
  assert.deepEqual(erros(ActualizarInscricaoDto, { estado: 'DESISTIU' }), []);
  // Concluir/cancelar têm endpoints próprios; não se chega lá por "actualizar".
  assert.deepEqual(erros(ActualizarInscricaoDto, { estado: 'CONCLUIDO' }), ['estado']);
  assert.deepEqual(erros(ActualizarInscricaoDto, { estado: 'CANCELADA' }), ['estado']);
  assert.deepEqual(erros(CancelarInscricaoDto, {}), ['motivo']);
  assert.deepEqual(erros(CancelarInscricaoDto, { motivo: 'ok' }), ['motivo']);
  assert.deepEqual(erros(CancelarInscricaoDto, { motivo: 'Mudou de turno' }), []);
  assert.deepEqual(erros(DefinirVagasDto, { vagas: null }), []);
  assert.deepEqual(erros(DefinirVagasDto, { vagas: 20 }), []);
  assert.deepEqual(erros(DefinirVagasDto, { vagas: 0 }), ['vagas']);
  assert.deepEqual(erros(DefinirVagasDto, { vagas: 2.5 }), ['vagas']);
  assert.deepEqual(erros(CreateFormacaoDto, { titulo: 'Primeiros socorros', tipo: 'SEGURANCA', vagas: 15 }), []);
  assert.deepEqual(erros(CreateFormacaoDto, { titulo: 'X', tipo: 'SEGURANCA', vagas: -1 }), ['vagas']);
});
