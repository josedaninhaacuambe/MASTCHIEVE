// Testes das regras puras de pacotes/recibos (destinatários) e dos planos de aula.
// Correr: npm run test:unit (node:test + ts-node, sem base de dados).
import 'reflect-metadata';
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { emailContactavel, destinatariosDoAtleta } from '../../src/common/utils/destinatarios-atleta.util';
import { segundaDaSemana, limparPartes } from '../../src/modules/planos-aula/planos-aula.service';
import { GuardarPlanoAulaDto } from '../../src/modules/planos-aula/dto/plano-aula.dto';
import { CreatePacoteDto } from '../../src/modules/pacotes/dto/pacote.dto';

test('emailContactavel ignora emails gerados pelo sistema e vazios', () => {
  assert.equal(emailContactavel('atleta_1731000000000_ab12cd34@mastchieve.com'), null);
  assert.equal(emailContactavel('encarregado_1731000000000_ff00aa11@mastchieve.com'), null);
  assert.equal(emailContactavel(''), null);
  assert.equal(emailContactavel(null), null);
  assert.equal(emailContactavel('sem-arroba'), null);
  assert.equal(emailContactavel(' maria@exemplo.co.mz '), 'maria@exemplo.co.mz');
  // Um email real do domínio da escola continua a contar.
  assert.equal(emailContactavel('secretaria@mastchieve.com'), 'secretaria@mastchieve.com');
});

test('destinatariosDoAtleta inclui atleta e todos os encarregados, sem duplicados nem contas inactivas', () => {
  const d = destinatariosDoAtleta({
    user: { id: 'u-atleta', email: 'atleta_1_x@mastchieve.com', isActive: true },
    parents: [
      { parent: { user: { id: 'u-pai', email: 'pai@exemplo.com', isActive: true } } },
      { parent: { user: { id: 'u-pai', email: 'pai@exemplo.com', isActive: true } } },
      { parent: { user: { id: 'u-mae', email: 'mae@exemplo.com', isActive: false } } },
      { parent: { user: null } },
      { parent: null },
    ],
  });
  assert.deepEqual(d, [
    { userId: 'u-atleta', email: null, papel: 'ATLETA' },
    { userId: 'u-pai', email: 'pai@exemplo.com', papel: 'ENCARREGADO' },
  ]);
  assert.deepEqual(destinatariosDoAtleta({}), []);
});

test('segundaDaSemana devolve a segunda-feira (UTC) de qualquer dia da semana', () => {
  assert.equal(segundaDaSemana('2026-11-13').toISOString().slice(0, 10), '2026-11-09'); // sexta
  assert.equal(segundaDaSemana('2026-11-09').toISOString().slice(0, 10), '2026-11-09'); // segunda
  assert.equal(segundaDaSemana('2026-11-15').toISOString().slice(0, 10), '2026-11-09'); // domingo
  assert.equal(segundaDaSemana('2027-01-01').toISOString().slice(0, 10), '2026-12-28'); // muda de ano
  assert.throws(() => segundaDaSemana('2026-02-30'));
});

test('limparPartes mantém só dias conhecidos e rejeita textos excessivos', () => {
  const r = limparPartes([
    { nome: ' Aquecimento ', tempo: ' 10 min ', dias: { SEG: ' pernada ', DOM: 'x', TER: '   ', SAB: 'jogo' } as any },
  ]);
  assert.deepEqual(r, [{ nome: 'Aquecimento', tempo: '10 min', dias: { SEG: 'pernada', SAB: 'jogo' } }]);
  assert.throws(() => limparPartes([{ nome: 'P', dias: { SEG: 'a'.repeat(1001) } }]));
});

test('GuardarPlanoAulaDto valida turma, data e partes', () => {
  const ok = plainToInstance(GuardarPlanoAulaDto, {
    classId: '3f1c2a7e-8b4d-4c1a-9e2f-1a2b3c4d5e6f',
    semana: '2026-11-13',
    partes: [{ nome: 'Parte Principal', dias: { SEG: 'crawl' } }],
  });
  assert.equal(validateSync(ok).length, 0);
  const mau = plainToInstance(GuardarPlanoAulaDto, { classId: 'x', semana: '13/11/2026', partes: [{ dias: {} }] });
  const props = validateSync(mau).map((e) => e.property).sort();
  assert.deepEqual(props, ['classId', 'partes', 'semana']);
});

test('CreatePacoteDto exige nome e preço não negativo com até 2 casas decimais', () => {
  assert.equal(validateSync(plainToInstance(CreatePacoteDto, { nome: 'Mensal 2x', preco: 2500.5 })).length, 0);
  assert.ok(validateSync(plainToInstance(CreatePacoteDto, { nome: 'M', preco: -1 })).length > 0);
  assert.ok(validateSync(plainToInstance(CreatePacoteDto, { nome: 'Mensal', preco: 10.123 })).length > 0);
});
