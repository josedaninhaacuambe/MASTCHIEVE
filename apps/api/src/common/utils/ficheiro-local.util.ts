import { NotFoundException } from '@nestjs/common';
import { access } from 'fs/promises';
import { basename, join } from 'path';
import { Response } from 'express';

/** Caminho no disco de um URL `/uploads/<nome>` guardado na BD (sem travessia de pastas). */
export async function caminhoUploadLocal(url?: string | null): Promise<string> {
  if (!url || !url.startsWith('/uploads/')) throw new NotFoundException('Ficheiro não encontrado');
  const nome = basename(url);
  if (!nome || nome !== url.slice('/uploads/'.length) || nome.startsWith('.')) throw new NotFoundException('Ficheiro não encontrado');
  const caminho = join(process.cwd(), 'uploads', nome);
  try { await access(caminho); } catch { throw new NotFoundException('O ficheiro já não existe no servidor'); }
  return caminho;
}

/** Envia um ficheiro privado: sem cache partilhada e sem interpretação pelo browser. */
export function enviarFicheiroPrivado(res: Response, caminho: string) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(caminho);
}
