// Testes das regras puras: erros da IA, leitura do JSON da IA e validação dos novos formulários.
// Correr: npm run test:unit (node:test + ts-node, sem base de dados nem chamadas à IA).
import 'reflect-metadata';
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { HttpException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { erroDaIa, extrairJson, textoDaResposta } from '../../src/modules/ai/ai-errors.util';
import { CreateCobrancaDto } from '../../src/modules/financial/dto/create-cobranca.dto';
import { CreateTrainingPlanDto } from '../../src/modules/training-plans/dto/create-training-plan.dto';
import { CreateFeedbackManualDto } from '../../src/modules/feedback/dto/feedback.dto';

const erros = (cls: any, obj: any) => validateSync(plainToInstance(cls, obj), { whitelist: true, forbidNonWhitelisted: true });

test('extrairJson: aceita blocos de código e texto à volta', () => {
  assert.deepEqual(extrairJson('Aqui está:\n```json\n{"title":"A","exercises":[]}\n```'), { title: 'A', exercises: [] });
  assert.equal(extrairJson('sem json'), null);
  assert.equal(extrairJson('{"title": "cortado'), null);
});

test('textoDaResposta: junta só os blocos de texto', () => {
  assert.equal(textoDaResposta({ content: [{ type: 'thinking' }, { type: 'text', text: 'a' } as any, { type: 'text', text: 'b' } as any] }), 'a\nb');
});

test('erroDaIa: chave inválida nunca vira 401 (não termina a sessão do utilizador)', () => {
  const auth = new Anthropic.AuthenticationError(401, { error: { message: 'invalid x-api-key' } }, 'invalid x-api-key', new Headers() as any);
  const e = erroDaIa(auth, 'gerar o plano');
  assert.equal(e.getStatus(), 503);
  assert.match(String(e.message), /chave da IA/);
});

test('erroDaIa: sem créditos e limites têm mensagens próprias', () => {
  const semCredito = new Anthropic.BadRequestError(400, { error: { message: 'Your credit balance is too low' } }, 'Your credit balance is too low', new Headers() as any);
  assert.match(String(erroDaIa(semCredito, 'x').message), /créditos/);
  const limite = new Anthropic.RateLimitError(429, {}, 'rate', new Headers() as any);
  assert.equal(erroDaIa(limite, 'x').getStatus(), 429);
  const http = new HttpException('já existe', 409);
  assert.equal(erroDaIa(http, 'x'), http);
  assert.equal(erroDaIa(new Error('boom'), 'x').getStatus(), 500);
});

test('cobrança individual: valida valor, data e campos extra', () => {
  assert.equal(erros(CreateCobrancaDto, { studentId: 's1', amount: 1500, dueDate: '2026-12-05', tipo: 'MENSALIDADE', month: 12, year: 2026 }).length, 0);
  assert.ok(erros(CreateCobrancaDto, { studentId: 's1', amount: 0, dueDate: '2026-12-05' }).length > 0);
  assert.ok(erros(CreateCobrancaDto, { studentId: 's1', amount: 10, dueDate: 'amanhã' }).length > 0);
  assert.ok(erros(CreateCobrancaDto, { studentId: 's1', amount: 10, dueDate: '2026-12-05', allActive: true }).length > 0);
});

test('plano manual: valida exercícios aninhados', () => {
  const ok = { studentId: 's1', title: 'Plano', objectives: ['Respirar'], exercises: [{ name: 'Crol', sets: 3, reps: 10 }] };
  assert.equal(erros(CreateTrainingPlanDto, ok).length, 0);
  assert.ok(erros(CreateTrainingPlanDto, { ...ok, exercises: [{ sets: 3 }] }).length > 0);
  assert.ok(erros(CreateTrainingPlanDto, { ...ok, title: '' }).length > 0);
});

test('feedback manual: exige texto', () => {
  assert.equal(erros(CreateFeedbackManualDto, { studentId: 's1', texto: 'Bom trabalho' }).length, 0);
  assert.ok(erros(CreateFeedbackManualDto, { studentId: 's1', texto: '' }).length > 0);
});
