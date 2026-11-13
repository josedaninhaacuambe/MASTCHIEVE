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

// ── Sessão de aula: entrada obrigatória e saída automática ao fim de 50 min ──
import {
  DURACAO_AULA_MIN, JANELA_SAIDA_MAX_H, decidirSaidaManual, saidaAutomaticaPara, validarNovaEntrada, RegistoSessao,
} from '../../src/modules/administrativo/entrada-saida/sessao-aula.util';

const reg = (id: string, tipo: string, min: number, automatica = false): RegistoSessao =>
  ({ id, tipo, dataHora: minutos(min), automatica });
const aulaAs = (min: number): RegistoSessao[] =>
  [reg('e', 'ENTRADA', min), reg('s', 'SAIDA', min + DURACAO_AULA_MIN, true)];

test('sessão: a saída automática fica 50 min depois da entrada', () => {
  assert.equal(saidaAutomaticaPara(AGORA).getTime() - AGORA.getTime(), 50 * 60_000);
});

test('sessão: saída sem entrada é recusada', () => {
  const d = decidirSaidaManual([], AGORA);
  assert.ok('erro' in d && /não tem entrada/.test(d.erro));
});

test('sessão: saída manual substitui a saída automática (encurtar e prolongar)', () => {
  const encurtar = decidirSaidaManual(aulaAs(-20), AGORA);
  assert.ok(!('erro' in encurtar) && encurtar.substituir?.id === 's');
  const prolongar = decidirSaidaManual(aulaAs(-70), AGORA);
  assert.ok(!('erro' in prolongar) && prolongar.substituir?.id === 's');
});

test('sessão: segunda saída manual é recusada', () => {
  const d = decidirSaidaManual([reg('e', 'ENTRADA', -40), reg('s', 'SAIDA', -5)], AGORA);
  assert.ok('erro' in d && /já foi registada/.test(d.erro));
});

test('sessão: entrada antiga demais não permite saída', () => {
  const d = decidirSaidaManual([reg('e', 'ENTRADA', -(JANELA_SAIDA_MAX_H * 60 + 1))], AGORA);
  assert.ok('erro' in d);
});

test('sessão: entrada antiga sem saída automática (dados anteriores) ainda aceita saída', () => {
  const d = decidirSaidaManual([reg('e', 'ENTRADA', -30)], AGORA);
  assert.ok(!('erro' in d) && d.substituir === undefined);
});

test('sessão: não aceita nova entrada durante a aula, aceita depois', () => {
  assert.match(validarNovaEntrada(aulaAs(-10), AGORA)!, /já tem uma entrada/);
  assert.equal(validarNovaEntrada(aulaAs(-60), AGORA), null);
  // aula encurtada por saída manual: pode voltar a entrar depois dela
  assert.equal(validarNovaEntrada([reg('e', 'ENTRADA', -30), reg('s', 'SAIDA', -5)], AGORA), null);
});

test('sessão: entrada manual que coincide com outra entrada posterior é recusada', () => {
  assert.match(validarNovaEntrada(aulaAs(20), AGORA)!, /coincide/);
  assert.equal(validarNovaEntrada(aulaAs(60), AGORA), null);
});
