'use client';
import { useEffect, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

/** Atrasa a actualização de um valor (ex.: texto de pesquisa) para não fazer um pedido por tecla. */
export function useDebounced<T>(value: T, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

type Atleta = { id: string; firstName: string; lastName: string };

/**
 * Selecção de atleta com pesquisa no servidor: funciona com qualquer número de atletas,
 * ao contrário de um <select> carregado com uma página fixa da lista.
 */
export function StudentSearchSelect({ value, onChange, placeholder = 'Pesquisar atleta pelo nome...', emptyLabel, apenasActivos = true }: {
  value: string;
  onChange: (id: string, atleta: Atleta | null) => void;
  placeholder?: string;
  /** Texto do botão para limpar a escolha quando o campo é opcional (ex.: "Nenhum"). */
  emptyLabel?: string;
  apenasActivos?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [aberto, setAberto] = useState(false);
  const [resultados, setResultados] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(false);
  const [escolhido, setEscolhido] = useState<Atleta | null>(null);
  const termo = useDebounced(search.trim());

  useEffect(() => { if (!value) setEscolhido(null); }, [value]);

  useEffect(() => {
    if (!aberto) return;
    let activo = true;
    setLoading(true);
    api.get('/students', { params: { limit: 20, ...(apenasActivos && { isActive: true }), ...(termo && { search: termo }) } })
      .then((r) => { if (activo) setResultados(r.data.data ?? []); })
      .catch(() => { if (activo) setResultados([]); })
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, [termo, aberto, apenasActivos]);

  const escolher = (a: Atleta | null) => {
    setEscolhido(a);
    setAberto(false);
    setSearch('');
    onChange(a?.id ?? '', a);
  };

  if (value && escolhido) {
    return (
      <div className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50">
        <span className="font-medium text-gray-900">{escolhido.firstName} {escolhido.lastName}</span>
        <button type="button" onClick={() => escolher(null)} className="text-gray-400 hover:text-gray-600" title="Alterar atleta">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setAberto(true); }}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm"
        />
      </div>
      {aberto && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {emptyLabel && (
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => escolher(null)}
              className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50">{emptyLabel}</button>
          )}
          {loading ? (
            <p className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> A pesquisar...</p>
          ) : resultados.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">Nenhum atleta encontrado</p>
          ) : (
            <>
              {resultados.map((a) => (
                <button key={a.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => escolher(a)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-50">
                  {a.firstName} {a.lastName}
                </button>
              ))}
              {!termo && <p className="px-3 py-2 text-xs text-gray-400 border-t">Escreve o nome para encontrar outros atletas.</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
