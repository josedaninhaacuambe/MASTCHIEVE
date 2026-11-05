// Testes das regras puras da hora manual de entrada/saída e dos links de acesso.
// Correr: npm run test:unit (node:test + ts-node, sem base de dados).
import 'reflect-metadata';
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RegisterDto } from '../../src/modules/auth/dto/register.dto';
import { validarHoraManual, HORA_MANUAL_MAX_DIAS } from '../../src/modules/administrativo/entrada-saida/hora-manual.util';
import {
  gerarTokenReset, prefixoReset, tokenResetValido, VALIDADE_CONVITE_MS, VALIDADE_RECUPERACAO_MS,
} from '../../src/common/utils/reset-token.util';

const AGORA = new Date('2026-11-05T12:00:00Z');
const minutos = (m: number) => new Date(AGORA.getTime() + m * 60_000);

test('hora manual: aceita o passado recente', () => {
  assert.equal(validarHoraManual(minutos(-90), AGORA), null);
  assert.equal(validarHoraManual(minutos(-(HORA_MANUAL_MAX_DIAS * 24 * 60)), AGORA), null);
});

test('hora manual: rejeita futuro, além da tolerância do relógio', () => {
  assert.equal(validarHoraManual(minutos(4), AGORA), null);
  assert.match(validarHoraManual(minutos(10), AGORA)!, /futuro/);
});

test('hora manual: rejeita registos antigos demais e datas inválidas', () => {
  assert.match(validarHoraManual(minutos(-(HORA_MANUAL_MAX_DIAS * 24 * 60 + 1)), AGORA)!, /dias atrás/);
  assert.equal(validarHoraManual(new Date('x'), AGORA), 'Hora inválida');
});

test('token de acesso: o token nunca fica guardado em claro', () => {
  const { token, armazenado } = gerarTokenReset(VALIDADE_CONVITE_MS);
  assert.equal(token.length, 64);
  assert.ok(!armazenado.includes(token));
  assert.ok(armazenado.startsWith(prefixoReset(token)));
});

test('token de acesso: cada geração é diferente', () => {
  assert.notEqual(gerarTokenReset(VALIDADE_CONVITE_MS).token, gerarTokenReset(VALIDADE_CONVITE_MS).token);
});

test('token de acesso: válido até expirar', () => {
  const inicio = 1_000_000;
  const { token, armazenado } = gerarTokenReset(VALIDADE_RECUPERACAO_MS, inicio);
  assert.ok(tokenResetValido(armazenado, token, inicio + VALIDADE_RECUPERACAO_MS - 1));
  assert.ok(!tokenResetValido(armazenado, token, inicio + VALIDADE_RECUPERACAO_MS));
});

test('token de acesso: rejeita token errado, sem valor guardado ou no formato antigo', () => {
  const { token, armazenado } = gerarTokenReset(VALIDADE_CONVITE_MS);
  assert.ok(!tokenResetValido(armazenado, 'outro', 0));
  assert.ok(!tokenResetValido(null, token));
  assert.ok(!tokenResetValido(`reset:${token}`, token));
  assert.ok(!tokenResetValido(prefixoReset(token), token, 0));
});

const errosDoPerfil = (role: string) => validateSync(plainToInstance(RegisterDto, {
  email: 'a@exemplo.com', password: '12345678', firstName: 'A', lastName: 'B', role,
})).filter((e) => e.property === 'role');

test('registo público: recusa perfis com mais permissões', () => {
  for (const role of ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'FINANCIAL', 'GESTOR_RH', 'ASSISTENTE_ADMIN', 'PARENT']) {
    assert.equal(errosDoPerfil(role).length, 1, role);
  }
});

test('registo público: aceita os perfis oferecidos pela página de registo', () => {
  for (const role of ['STUDENT', 'INSTRUCTOR', 'VISITOR']) {
    assert.equal(errosDoPerfil(role).length, 0, role);
  }
});
