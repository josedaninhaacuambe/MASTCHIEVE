'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Award, Plus, Search, ChevronRight, Loader2 } from 'lucide-react';

const NIVEL_CORES: Record<string, string> = { BRONZE:'bg-amber-100 text-amber-700 border-amber-300', PRATA:'bg-gray-100 text-gray-600 border-gray-300', OURO:'bg-yellow-100 text-yellow-700 border-yellow-300' };
const NIVEL_ROUTE: Record<string, string> = { BRONZE: '/ama', PRATA: '/intermediario', OURO: '/avancado' };
const NIVEL_LABEL: Record<string, string> = { BRONZE: 'Módulo AMA', PRATA: 'Módulo Intermédio', OURO: 'Módulo Avançado' };

interface ProntoInfo { studentId: string; name: string; nivel: string; }

export default function CertificadosPage() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [fases, setFases] = useState<any[]>([]);
  const [form, setForm] = useState({ studentId:'', faseId:'', dataEmissao:'' });
  const [prontos, setProntos] = useState<ProntoInfo[]>([]);
  const [loadingProntos, setLoadingProntos] = useState(true);

  const load = async () => {
    setLoading(true);
    const r = await api.get('/certificados', { params: { search: search || undefined } });
    setCerts(r.data.data || r.data);
    setLoading(false);
  };

  const loadProntos = async () => {
    setLoadingProntos(true);
    try {
      const [rAma, rInt, rAv] = await Promise.all([
        api.get('/fases/nivel/AMA'),
        api.get('/fases/nivel/INTERMEDIARIO'),
        api.get('/fases/nivel/AVANCADO'),
      ]);
      const result: ProntoInfo[] = [];
      const modules: { nivel: string; nivelCert: string; fases: any[] }[] = [
        { nivel: 'AMA', nivelCert: 'BRONZE', fases: rAma.data?.data ?? rAma.data ?? [] },
        { nivel: 'INTERMEDIARIO', nivelCert: 'PRATA', fases: rInt.data?.data ?? rInt.data ?? [] },
        { nivel: 'AVANCADO', nivelCert: 'OURO', fases: rAv.data?.data ?? rAv.data ?? [] },
      ];
      for (const mod of modules) {
        if (mod.fases.length < 3) continue;
        const allIds = new Set(mod.fases.flatMap((f: any) => f.studentFases?.map((sf: any) => sf.studentId) ?? []));
        Array.from(allIds).forEach(sid => {
          const doneInAll = mod.fases.every((f: any) =>
            f.studentFases?.some((sf: any) => sf.studentId === sid && sf.estado === 'CONCLUIDO')
          );
          if (!doneInAll) return;
          // get student name from any fase
          const sf = mod.fases[0].studentFases?.find((sf: any) => sf.studentId === sid);
          const name = sf?.student?.name ?? sid;
          result.push({ studentId: sid as string, name, nivel: mod.nivelCert });
        });
      }
      setProntos(result);
    } catch { /* silently ignore */ }
    finally { setLoadingProntos(false); }
  };

  useEffect(() => { load(); }, [search]);
  useEffect(() => { loadProntos(); }, []);

  const openForm = async () => {
    const [s, f] = await Promise.all([api.get('/students'), api.get('/fases')]);
    setStudents(s.data.data || s.data);
    setFases(f.data.data || f.data);
    setShowForm(true);
  };

  const emitir = async () => {
    await api.post('/certificados', { ...form, dataEmissao: form.dataEmissao ? new Date(form.dataEmissao).toISOString() : undefined });
    setShowForm(false);
    setForm({ studentId:'', faseId:'', dataEmissao:'' });
    load();
  };

  const totalPorNivel = (nivel: string) => certs.filter(c => c.fase?.certificacao === nivel).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificados</h1>
          <p className="text-gray-500 text-sm mt-1">Emissão e gestão de certificados Bronze, Prata e Ouro (SOP 07)</p>
        </div>
        <button onClick={openForm} className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Emitir Certificado
        </button>
      </div>

      {/* Stats por nível — cada tile linka ao módulo correspondente */}
      <div className="grid grid-cols-3 gap-4">
        {[['BRONZE','bg-amber-50','text-amber-700'],['PRATA','bg-gray-50','text-gray-600'],['OURO','bg-yellow-50','text-yellow-700']].map(([n,bg,tc]) => (
          <Link key={n} href={NIVEL_ROUTE[n]} className={`${bg} rounded-2xl p-5 border border-gray-200 hover:shadow-md transition-shadow group`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Award className={`w-5 h-5 ${tc}`} />
                <span className={`font-semibold ${tc}`}>{n}</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${tc} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className="text-3xl font-bold text-gray-800">{totalPorNivel(n)}</div>
            <div className="text-sm text-gray-500 mt-1">certificados emitidos</div>
            <div className={`text-xs mt-1.5 ${tc} opacity-70`}>{NIVEL_LABEL[n]}</div>
          </Link>
        ))}
      </div>

      {/* Sugestões — atletas prontos para certificação */}
      {(loadingProntos || prontos.length > 0) && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-green-600" />
            <h2 className="text-sm font-bold text-green-800">Prontos para Certificação</h2>
            <span className="text-xs text-green-500 ml-1">Completaram todas as fases do módulo</span>
          </div>
          {loadingProntos ? (
            <div className="flex items-center gap-2 text-green-600 text-xs"><Loader2 className="w-4 h-4 animate-spin" /> A calcular...</div>
          ) : (
            <div className="space-y-2">
              {prontos.map((p, i) => {
                // check if they already have a cert for this nivel
                const jaTem = certs.some(c => c.student && (c.student.id === p.studentId || `${c.student.firstName} ${c.student.lastName}`.trim() === p.name) && c.fase?.certificacao === p.nivel);
                if (jaTem) return null;
                return (
                  <div key={i} className="flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-2.5 border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(p.name[0] ?? '?').toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${NIVEL_CORES[p.nivel]}`}>{p.nivel}</span>
                      <button
                        onClick={() => { openForm(); }}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-medium transition"
                      >
                        Emitir
                      </button>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
              {prontos.filter(p => !certs.some(c => c.student && (c.student.id === p.studentId || `${c.student.firstName} ${c.student.lastName}`.trim() === p.name) && c.fase?.certificacao === p.nivel)).length === 0 && (
                <p className="text-xs text-green-600">Todos os atletas prontos já receberam os seus certificados.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Buscar por aluno ou número de série..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
      </div>

      {/* Lista */}
      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nº Série','Aluno','Fase','Nível','Data Emissão','Evento'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {certs.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhum certificado encontrado</td></tr>}
              {certs.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.numeroSerie}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.student ? `${c.student.firstName} ${c.student.lastName}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.fase?.nome}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${NIVEL_CORES[c.fase?.certificacao]}`}>{c.fase?.certificacao}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.dataEmissao ? new Date(c.dataEmissao).toLocaleDateString('pt-PT') : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.evento?.nome || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-gray-900">Emitir Certificado</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aluno*</label>
              <select value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Selecionar aluno...</option>
                {students.map((s: any) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fase concluída*</label>
              <select value={form.faseId} onChange={e => setForm(f => ({ ...f, faseId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Selecionar fase...</option>
                {fases.map((f: any) => <option key={f.id} value={f.id}>Fase {f.ordem} — {f.nome} ({f.certificacao})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Emissão</label>
              <input type="date" value={form.dataEmissao} onChange={e => setForm(f => ({ ...f, dataEmissao: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={emitir} disabled={!form.studentId || !form.faseId} className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50">Emitir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
