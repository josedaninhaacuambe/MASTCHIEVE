import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { formatoPorAssinatura } from '../../src/modules/eventos/eventos-imagens.util';

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
