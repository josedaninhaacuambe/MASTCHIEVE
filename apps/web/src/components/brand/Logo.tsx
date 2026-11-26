/* eslint-disable @next/next/no-img-element */
import { cn } from '@/lib/utils';

/**
 * Logótipo oficial da Mastchieve.
 * - `fundo="claro"`: cores originais (texto preto) para fundos brancos/claros.
 * - `fundo="escuro"`: texto em branco para fundos escuros.
 * - `fundo="auto"`: segue o modo claro/escuro da aplicação.
 * - `slogan`: inclui «Before you achieve, you must believe» (usar só em tamanhos grandes).
 */
export function Logo({
  fundo = 'claro',
  slogan = false,
  className,
}: {
  fundo?: 'claro' | 'escuro' | 'auto';
  slogan?: boolean;
  className?: string;
}) {
  const base = slogan ? '/brand/logo-completo' : '/brand/logo';
  const cls = cn('h-8 w-auto select-none', className);
  const alt = 'Mastchieve';
  if (fundo === 'auto') {
    return (
      <>
        <img src={`${base}.png`} alt={alt} className={cn(cls, 'dark:hidden')} draggable={false} />
        <img src={`${base}-branco.png`} alt={alt} className={cn(cls, 'hidden dark:block')} draggable={false} />
      </>
    );
  }
  return <img src={fundo === 'escuro' ? `${base}-branco.png` : `${base}.png`} alt={alt} className={cls} draggable={false} />;
}

/** Só o símbolo (sem texto) — para espaços muito pequenos. */
export function SimboloMarca({ className }: { className?: string }) {
  return <img src="/brand/simbolo.png" alt="Mastchieve" className={cn('h-6 w-auto select-none', className)} draggable={false} />;
}
