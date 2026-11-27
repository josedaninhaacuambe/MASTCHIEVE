'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, ChevronDown, Home, Users, DoorOpen, BarChart3, Sun, Package, MapPin, ListFilter,
  CalendarCheck, UserCircle, LayoutGrid, HelpCircle, Lightbulb, AlertTriangle, Link2, Check,
  Sparkle, ArrowUpRight, X, BookOpenCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { GROUPS, navItems, podeVerItem, type NavItem } from '@/lib/navegacao';
import { TOPICOS, NOVIDADES, ATUALIZADO_EM, type Bloco, type Secao, type Topico } from '@/lib/guia/conteudo';

const ICONES: Record<Topico['icone'], typeof Home> = {
  inicio: Home, familia: Users, entradas: DoorOpen, relatorios: BarChart3, ferias: Sun, pacotes: Package,
  unidades: MapPin, turmas: ListFilter, presencas: CalendarCheck, perfil: UserCircle, outros: LayoutGrid, duvidas: HelpCircle,
};

/** Rotas que não precisam de tema próprio. */
const SEM_GUIA = ['/guia', '/dashboard', '/instructor'];

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function navPorRota(rota: string): NavItem | undefined {
  return navItems.find((n) => n.href === rota);
}

/** A rota existe no menu e o perfil tem acesso. Rotas de detalhe (ex.: "/students/") usam a página-mãe. */
function rotaAcessivel(rota: string, role?: string | null) {
  const base = rota.replace(/\/$/, '');
  const item = navPorRota(base);
  return !!item && podeVerItem(item, role);
}

function textoBloco(b: Bloco): string {
  switch (b.t) {
    case 'onde': return [navPorRota(b.rota)?.label ?? '', ...(b.extra ?? [])].join(' ');
    case 'passos': case 'lista': return b.itens.join(' ');
    case 'p': return b.texto;
    case 'dica': case 'aviso': return `${b.titulo} ${b.texto}`;
    case 'tabela': return [...b.cab, ...b.linhas.flat()].join(' ');
  }
}

/** Texto com **negrito** e [[Botão]]. */
function Rico({ texto }: { texto: string }) {
  const partes = texto.split(/(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g).filter(Boolean);
  return (
    <>
      {partes.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-semibold text-gray-900 dark:text-white">{p.slice(2, -2)}</strong>;
        if (p.startsWith('[[') && p.endsWith(']]')) {
          return (
            <span key={i} className="inline-flex items-center rounded-md border border-gray-200 bg-white px-1.5 py-px text-[0.85em] font-semibold text-gray-800 shadow-[0_1px_0_rgba(0,0,0,0.04)] whitespace-nowrap dark:border-white/15 dark:bg-white/10 dark:text-white">
              {p.slice(2, -2)}
            </span>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function Onde({ rota, extra }: { rota: string; extra?: string[] }) {
  const item = navPorRota(rota);
  if (!item) return null;
  const caminho = ['Menu', ...(item.group ? [GROUPS[item.group].label] : []), item.label, ...(extra ?? [])];
  return (
    <Link
      href={item.href}
      className="group mb-4 inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-brand-blue/[0.06] px-3 py-1.5 text-sm font-medium text-brand-blue hover:bg-brand-blue/10 dark:bg-white/5 dark:text-blue-200"
    >
      {caminho.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="text-brand-red">›</span>}
          {c}
        </span>
      ))}
      <ArrowUpRight className="ml-1 h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
    </Link>
  );
}

function RenderBloco({ b }: { b: Bloco }) {
  switch (b.t) {
    case 'onde':
      return <Onde rota={b.rota} extra={b.extra} />;
    case 'passos':
      return (
        <ol className="mb-3 space-y-2.5">
          {b.itens.map((it, i) => (
            <li key={i} className="flex gap-3 max-w-[70ch]">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">{i + 1}</span>
              <span className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-300"><Rico texto={it} /></span>
            </li>
          ))}
        </ol>
      );
    case 'lista':
      return (
        <ul className="mb-3 space-y-1.5">
          {b.itens.map((it, i) => (
            <li key={i} className="flex gap-2.5 max-w-[70ch] text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-green" />
              <span><Rico texto={it} /></span>
            </li>
          ))}
        </ul>
      );
    case 'p':
      return <p className="mb-3 max-w-[70ch] text-[15px] leading-relaxed text-gray-700 dark:text-gray-300"><Rico texto={b.texto} /></p>;
    case 'dica':
    case 'aviso': {
      const aviso = b.t === 'aviso';
      const Icon = aviso ? AlertTriangle : Lightbulb;
      return (
        <div className={cn(
          'my-4 flex max-w-[72ch] gap-3 rounded-xl border px-4 py-3 text-[15px]',
          aviso
            ? 'border-brand-red/20 bg-brand-red/[0.05] text-gray-800 dark:bg-brand-red/10 dark:text-gray-200'
            : 'border-brand-green/25 bg-brand-green/[0.06] text-gray-800 dark:bg-brand-green/10 dark:text-gray-200',
        )}>
          <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', aviso ? 'text-brand-red' : 'text-brand-green')} />
          <div><strong className="block font-semibold">{b.titulo}</strong><Rico texto={b.texto} /></div>
        </div>
      );
    }
    case 'tabela':
      return (
        <div className="mb-4 max-w-3xl overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="hidden bg-gray-50 sm:table-header-group dark:bg-white/5">
              <tr>{b.cab.map((c) => <th key={c} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{c}</th>)}</tr>
            </thead>
            <tbody>
              {b.linhas.map((l, i) => (
                <tr key={i} className="block border-t border-gray-100 px-3 py-2 first:border-t-0 sm:table-row sm:p-0 dark:border-white/10">
                  {l.map((c, j) => (
                    <td key={j} className={cn('block py-0.5 align-top text-gray-700 sm:table-cell sm:px-3 sm:py-2.5 dark:text-gray-300', j === 0 && 'font-semibold text-gray-900 dark:text-white')}>
                      <span className="mr-1 text-xs text-gray-400 sm:hidden">{j > 0 ? `${b.cab[j]}:` : ''}</span>
                      <Rico texto={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

function GuiaConteudo() {
  const { user } = useAuthStore();
  const role = user?.role;
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [copiado, setCopiado] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  const secaoVisivel = (s: Secao) => !s.rota || rotaAcessivel(s.rota, role);

  // Temas que este perfil pode usar (só secções de páginas a que tem acesso e que existem no menu).
  const topicos = useMemo(
    () => TOPICOS
      .map((t) => ({ ...t, secoes: t.secoes.filter(secaoVisivel) }))
      .filter((t) => t.secoes.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [role],
  );

  const indice = useMemo(() => {
    const m: Record<string, string> = {};
    topicos.forEach((t) => {
      m[t.id] = normalizar([t.titulo, t.sub, ...t.secoes.flatMap((s) => [s.titulo ?? '', ...s.blocos.map(textoBloco)])].join(' '));
    });
    return m;
  }, [topicos]);

  const palavras = normalizar(q).trim().split(/\s+/).filter(Boolean);
  const visiveis = palavras.length ? topicos.filter((t) => palavras.every((w) => indice[t.id].includes(w))) : topicos;

  // Menu do perfil (o mesmo do menu lateral).
  const menu = useMemo(() => navItems.filter((n) => podeVerItem(n, role)), [role]);
  const rotasCobertas = useMemo(() => new Set(TOPICOS.flatMap((t) => [...t.rotas, ...t.secoes.map((s) => s.rota ?? '')]).map((r) => r.replace(/\/$/, ''))), []);
  const topicoDaRota = (href: string) => topicos.find((t) => t.rotas.some((r) => r.replace(/\/$/, '') === href) || t.secoes.some((s) => s.rota === href));
  const semGuia = menu.filter((n) => !rotasCobertas.has(n.href) && !SEM_GUIA.includes(n.href));

  const grupos = useMemo(() => {
    const g: { chave: string; label: string; itens: NavItem[] }[] = [{ chave: 'principal', label: 'Menu principal', itens: [] }];
    menu.forEach((n) => {
      if (n.href === '/guia') return;
      const chave = n.group ?? 'principal';
      let grupo = g.find((x) => x.chave === chave);
      if (!grupo) { grupo = { chave, label: n.group ? GROUPS[n.group].label : 'Menu principal', itens: [] }; g.push(grupo); }
      grupo.itens.push(n);
    });
    return g.filter((x) => x.itens.length);
  }, [menu]);

  const abrir = (id: string) => {
    setAbertos((a) => new Set(a).add(id));
    requestAnimationFrame(() => refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  // Ajuda contextual: /guia?pagina=/entrada-saida abre o tema dessa página; #id abre um tema.
  useEffect(() => {
    const pagina = params.get('pagina');
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    if (hash && topicos.some((t) => t.id === hash)) { abrir(hash); return; }
    if (pagina) {
      const candidatos = topicos
        .flatMap((t) => [...t.rotas, ...t.secoes.map((s) => s.rota ?? '')].filter(Boolean).map((r) => ({ t, r: r.replace(/\/$/, '') })))
        .filter(({ r }) => pagina === r || pagina.startsWith(r + '/'))
        .sort((a, b) => b.r.length - a.r.length);
      if (candidatos[0]) abrir(candidatos[0].t.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, topicos]);

  const recente = (data: string) => (Date.now() - new Date(data).getTime()) / 86_400_000 <= 30;

  const copiarLink = async (id: string) => {
    const url = `${window.location.origin}/guia#${id}`;
    try { await navigator.clipboard.writeText(url); setCopiado(id); setTimeout(() => setCopiado(null), 2000); } catch { /* sem acesso ao clipboard */ }
  };

  const toggle = (id: string) => setAbertos((a) => {
    const n = new Set(a);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      {/* Cabeçalho */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900">
        <div className="absolute inset-x-0 top-0 flex h-1">
          <span className="flex-1 bg-brand-blue" /><span className="flex-1 bg-brand-red" /><span className="flex-1 bg-brand-green" />
        </div>
        <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-blue/[0.07] px-3 py-1 text-xs font-semibold text-brand-blue dark:bg-white/10 dark:text-blue-200">
              <BookOpenCheck className="h-3.5 w-3.5" /> Guia do Sistema
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl dark:text-white">Como fazer cada tarefa no sistema</h1>
            <p className="mt-2 max-w-xl text-[15px] text-gray-500 dark:text-gray-400">
              Escreva o que precisa — por exemplo «irmãos», «saída», «relatório» ou «férias» — ou escolha um módulo no mapa.
              O guia mostra apenas o que o seu perfil pode usar.
            </p>
            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && visiveis[0]) abrir(visiveis[0].id); }}
                placeholder="O que quer fazer? Ex.: cadastrar irmãos"
                aria-label="Pesquisar no guia"
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-10 text-[15px] text-gray-900 outline-none transition focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              {q && (
                <button onClick={() => setQ('')} aria-label="Limpar pesquisa" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Actualizado em {new Date(ATUALIZADO_EM).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })} ·
              o mapa e os caminhos acompanham automaticamente o menu do sistema.
            </p>
          </div>

          {/* Mapa do menu — gerado a partir do menu real */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">O seu menu</p>
            <div className="grid max-h-[340px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {grupos.map((g) => (
                <div key={g.chave}>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-brand-red">{g.label}</p>
                  {g.itens.map((n) => {
                    const t = topicoDaRota(n.href);
                    const Icon = n.icon;
                    return (
                      <button
                        key={n.href}
                        onClick={() => (t ? abrir(t.id) : abrir('sem-guia'))}
                        className="group flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm text-gray-700 hover:bg-white hover:text-brand-blue dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                      >
                        <Icon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 group-hover:text-brand-blue" />
                        <span className="truncate">{n.label}</span>
                        {!t && <span className="ml-auto text-[10px] text-gray-400">sem guia</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Novidades */}
      {!q && NOVIDADES.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-gray-900">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Sparkle className="h-4 w-4 text-brand-green" /> Novidades no sistema
          </h2>
          <ul className="divide-y divide-gray-100 dark:divide-white/10">
            {NOVIDADES.slice(0, 4).map((n, i) => (
              <li key={i} className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:items-center sm:gap-4">
                <span className="w-24 flex-shrink-0 text-xs font-medium text-gray-400">
                  {new Date(n.data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                </span>
                <span className="flex-1 text-gray-700 dark:text-gray-300">{n.texto}</span>
                {n.topico && topicos.some((t) => t.id === n.topico) && (
                  <button onClick={() => abrir(n.topico!)} className="text-xs font-semibold text-brand-blue hover:underline dark:text-blue-300">Ver como fazer →</button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Atalhos de temas */}
      <nav aria-label="Temas" className="sticky top-0 z-10 -mx-1 flex gap-2 overflow-x-auto bg-gray-50/90 px-1 py-2 backdrop-blur dark:bg-gray-950/90 [scrollbar-width:none]">
        {visiveis.map((t) => (
          <button key={t.id} onClick={() => abrir(t.id)} className="flex-shrink-0 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:border-brand-blue hover:text-brand-blue dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
            {t.titulo.split(':')[0]}
          </button>
        ))}
      </nav>

      {/* Temas */}
      <div className="space-y-3">
        {visiveis.map((t) => {
          const Icon = ICONES[t.icone];
          const aberto = abertos.has(t.id) || palavras.length > 0;
          return (
            <section
              key={t.id}
              id={t.id}
              ref={(el) => { refs.current[t.id] = el; }}
              className="scroll-mt-16 overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-sm dark:border-white/10 dark:bg-gray-900"
            >
              <button onClick={() => toggle(t.id)} aria-expanded={aberto} className="flex w-full items-center gap-4 p-4 text-left md:p-5">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-blue/[0.07] text-brand-blue dark:bg-white/10 dark:text-blue-200">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-gray-900 md:text-lg dark:text-white">{t.titulo}</span>
                    {recente(t.atualizado) && <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-green">Actualizado</span>}
                  </span>
                  <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">{t.sub}</span>
                </span>
                <ChevronDown className={cn('h-5 w-5 flex-shrink-0 text-gray-400 transition-transform', aberto && 'rotate-180')} />
              </button>
              {aberto && (
                <div className="border-t border-gray-100 px-4 pb-5 pt-4 md:pl-[84px] md:pr-8 dark:border-white/10">
                  {t.secoes.map((s, i) => (
                    <div key={i} className={cn(i > 0 && 'mt-6')}>
                      {s.titulo && <h3 className="mb-3 text-[15px] font-semibold text-gray-900 dark:text-white">{s.titulo}</h3>}
                      {s.blocos.map((b, j) => <RenderBloco key={j} b={b} />)}
                    </div>
                  ))}
                  <button onClick={() => copiarLink(t.id)} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:border-brand-blue hover:text-brand-blue dark:border-white/10 dark:text-gray-300">
                    {copiado === t.id ? <><Check className="h-4 w-4 text-brand-green" /> Link copiado</> : <><Link2 className="h-4 w-4" /> Copiar link deste tema</>}
                  </button>
                </div>
              )}
            </section>
          );
        })}

        {visiveis.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-gray-900">
            Nada encontrado. Experimente outra palavra, por exemplo «turma», «pagamento» ou «saída».
          </div>
        )}

        {/* Módulos novos ou sem tema — gerado automaticamente a partir do menu */}
        {!q && semGuia.length > 0 && (
          <section id="sem-guia" ref={(el) => { refs.current['sem-guia'] = el; }} className="scroll-mt-16 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Outros módulos do seu menu</h2>
            <p className="mt-1 text-sm text-gray-500">Estes módulos estão disponíveis para si mas ainda não têm guia passo a passo. Abra-os para explorar ou peça ajuda ao administrador.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {semGuia.map((n) => {
                const Icon = n.icon;
                return (
                  <Link key={n.href} href={n.href} className="group flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 hover:border-brand-blue/30 hover:bg-brand-blue/[0.03] dark:border-white/10 dark:hover:bg-white/5">
                    <Icon className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-brand-blue" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-800 dark:text-gray-200">{n.label}</span>
                      <span className="block text-xs text-gray-400">{n.group ? GROUPS[n.group].label : 'Menu principal'}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-brand-blue" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function GuiaPage() {
  return (
    <Suspense fallback={null}>
      <GuiaConteudo />
    </Suspense>
  );
}
