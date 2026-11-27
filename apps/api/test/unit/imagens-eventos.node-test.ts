import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { formatoPorAssinatura, NOME_IMAGEM_EVENTO } from '../../src/modules/eventos/eventos-imagens.util';

test('imagens: reconhece JPEG, PNG e WEBP pelos primeiros bytes', () => {
  assert.equal(formatoPorAssinatura(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])), 'image/jpeg');
  assert.equal(formatoPorAssinatura(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), 'image/png');
  assert.equal(formatoPorAssinatura(Buffer.from('RIFF\x10\x00\x00\x00WEBP', 'latin1')), 'image/webp');
});

test('imagens: rejeita ficheiros que não são imagens (HTML/SVG disfarçado, WAV, vazio)', () => {
  assert.equal(formatoPorAssinatura(Buffer.from('<svg onload=alert(1)>')), null);
  assert.equal(formatoPorAssinatura(Buffer.from('RIFF\x10\x00\x00\x00WAVE', 'latin1')), null);
  assert.equal(formatoPorAssinatura(Buffer.alloc(0)), null);
});

test('só nomes gerados pelo servidor podem ser servidos publicamente', () => {
  assert.ok(NOME_IMAGEM_EVENTO.test('evento-1795499371269-ac60838603333c94.jpg'));
  assert.ok(NOME_IMAGEM_EVENTO.test('evento-1795499371269-ac60838603333c94.webp'));
  for (const mau of ['../.env', 'evento-1-ab.jpg', 'documento-1795499371269-ac60838603333c94.pdf', 'evento-1795499371269-ac60838603333c94.jpg/../x', 'evento-1795499371269-AC60838603333C94.jpg']) {
    assert.equal(NOME_IMAGEM_EVENTO.test(mau), false, mau);
  }
});

// ─── Imagens públicas genéricas e matrícula a partir do evento ────────────────
import { NOME_IMAGEM_PUBLICA } from '../../src/modules/ficheiros/ficheiros.controller';
import { dividirNome } from '../../src/modules/eventos/eventos-matricula.service';
import { caminhoUploadLocal } from '../../src/common/utils/ficheiro-local.util';

test('imagem pública: só nomes simples de imagem, sem caminhos', () => {
  assert.ok(NOME_IMAGEM_PUBLICA.test('1795499371269-123456.jpg'));
  assert.ok(NOME_IMAGEM_PUBLICA.test('evento-1795499371269-ac60838603333c94.webp'));
  assert.ok(!NOME_IMAGEM_PUBLICA.test('../.env'));
  assert.ok(!NOME_IMAGEM_PUBLICA.test('documento.pdf'));
  assert.ok(!NOME_IMAGEM_PUBLICA.test('a/b.png'));
  assert.ok(!NOME_IMAGEM_PUBLICA.test('.png'));
});

test('ficheiro privado: recusa URLs fora de /uploads ou com travessia', async () => {
  await assert.rejects(caminhoUploadLocal('/etc/passwd'));
  await assert.rejects(caminhoUploadLocal('/uploads/../.env'));
  await assert.rejects(caminhoUploadLocal('/uploads/sub/x.pdf'));
  await assert.rejects(caminhoUploadLocal(null));
});

test('dividirNome separa o primeiro nome dos apelidos sem inventar dados', () => {
  assert.deepEqual(dividirNome('  Ana   Maria  Cossa '), { firstName: 'Ana', lastName: 'Maria Cossa' });
  assert.deepEqual(dividirNome('Ana'), { firstName: 'Ana', lastName: '' });
  assert.deepEqual(dividirNome(''), { firstName: '', lastName: '' });
});
