import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { BadRequestException } from '@nestjs/common';

/** Formatos que qualquer browser mostra (HEIC fica de fora: não aparece no telemóvel de muitos encarregados). */
export const MIME_IMAGEM_EVENTO: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
export const MAX_BYTES_IMAGEM_EVENTO = 8 * 1024 * 1024;
export const MAX_IMAGENS_POR_EVENTO = 12;
/** Nome gerado pelo servidor (ver imagemEventoStorage); qualquer outro é recusado ao servir. */
export const NOME_IMAGEM_EVENTO = /^evento-\d{10,16}-[a-f0-9]{16}\.(jpg|png|webp)$/;

/** Nome aleatório e extensão decidida pelo servidor (nunca pelo nome enviado). */
export const imagemEventoStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => cb(null, `evento-${Date.now()}-${randomBytes(8).toString('hex')}${MIME_IMAGEM_EVENTO[file.mimetype] ?? '.bin'}`),
});

export function imagemEventoFilter(_req: any, file: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) {
  if (!MIME_IMAGEM_EVENTO[file.mimetype]) {
    cb(new BadRequestException('Formato não suportado — use JPEG, PNG ou WEBP'), false);
    return;
  }
  cb(null, true);
}

/** Identifica o formato real pelos primeiros bytes (o tipo enviado pelo browser pode ser falsificado). */
export function formatoPorAssinatura(b: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}
