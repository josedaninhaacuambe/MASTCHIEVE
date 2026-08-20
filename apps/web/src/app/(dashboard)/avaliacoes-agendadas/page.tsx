'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, ClipboardCheck, Calendar, Users, ChevronRight, AlertTriangle } from 'lucide-react';

const ESTADO_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  AGENDADA:     { label: 'Agendada',     bg: 'bg-blue-50',   text: 'text-blue-700' },
  EM_ANDAMENTO: { label: 'Em Andamento', bg: 'bg-amber-50',  text: 'text-amber-700' },
  CONCLUIDA:    { label: 'Concluída',    bg: 'bg-green-50',  text: 'text-green-700' },
  CANCELADA:    { label: 'Cancelada',    bg: 'bg-red-50',    text: 'text-red-700' },
};

function CreateSessaoModal({ classes, onClose, onSaved }: {
  classes: any[]; onClose: () => void; onSaved: () => void;
}) {
  const [classId, setClassId] = useState('');
  const [data, setData] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const salvar = async () => {
    if (!classId || !data) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/avaliacoes-agendadas', {
        classId,
        data: new Date(data).toISOString(),
        observacoes: observacoes || undefined,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao agendar avaliação');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Agendar Avaliação Formal</h2>
          <p className="text-sm text-gray-500 mt-0.5">Escolha a turma e a data — a avaliação segue a regra de conclusão de módulo</p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turma *</label>
            <select value={classId} onChange={e => setClassId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Selecionar turma...</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3}
              placeholder="Notas adicionais sobre a sessão..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={salvar} disabled={!classId || !data || saving}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'A agendar...' : 'Agendar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SessaoCard({ s }: { s: any }) {
  const cfg = ESTADO_CONFIG[s.estado] ?? { label: s.estado, bg: 'bg-gray-50', text: 'text-gray-700' };
  const avaliados = s._count?.resultados ?? 0;
  const total = s.class?._count?.enrollments ?? 0;
  const atrasada = s.estado === 'AGENDADA' && s.data && new Date(s.data) < new Date();

  return (
    <Link href={`/avaliacoes-agendadas/${s.id}`}
      className={`bg-white rounded-xl border p-5 flex items-center gap-4 hover:shadow-sm transition ${atrasada ? 'border-red-200 hover:border-red-300' : 'border-gray-200 hover:border-indigo-300'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${atrasada ? 'bg-red-50' : 'bg-indigo-50'}`}>
        <Calendar className={`w-5 h-5 ${atrasada ? 'text-red-600' : 'text-indigo-600'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap mb-1">
          <h3 className="font-semibold text-gray-900">{s.class?.name ?? '—'}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
          {atrasada && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Atrasada</span>}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{s.data ? new Date(s.data).toLocaleDateString('pt-PT') : '—'}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {avaliados}/{total} avaliados</span>
          {s.instructor && <span>por {s.instructor.firstName} {s.instructor.lastName}</span>}
        </div>
        {s.observacoes && <p className="text-xs text-gray-400 mt-1 italic">{s.observacoes}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
    </Link>
  );
}

export default function AvaliacoesAgendadasPage() {
  const user = useAuthStore(s => s.user);
  const [sessoes, setSessoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const r = await api.get('/avaliacoes-agendadas');
    setSessoes(r.data.data || r.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = async () => {
    const endpoint = user?.role === 'INSTRUCTOR' ? '/classes/my' : '/classes';
    const r = await api.get(endpoint);
    const data = r.data.data || r.data;
    setClasses(Array.isArray(data) ? data : []);
    setShowForm(true);
  };

  const atrasadas = sessoes.filter((s: any) => s.estado === 'AGENDADA' && s.data && new Date(s.data) < new Date());

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avaliações Agendadas</h1>
          <p className="text-gray-500 text-sm mt-1">Sessões formais de avaliação — decidem a transição de módulo dos atletas</p>
        </div>
        <button onClick={openForm}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Agendar Avaliação
        </button>
      </div>

      {!loading && atrasadas.length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">{atrasadas.length} avaliaç{atrasadas.length === 1 ? 'ão' : 'ões'} atrasada{atrasadas.length === 1 ? '' : 's'}</span>
            {' '}— a data agendada já passou e a sessão continua por realizar.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">A carregar...</div>
      ) : (
        <div className="space-y-3">
          {sessoes.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Nenhuma sessão de avaliação agendada</p>
            </div>
          )}
          {sessoes.map((s: any) => <SessaoCard key={s.id} s={s} />)}
        </div>
      )}

      {showForm && (
        <CreateSessaoModal classes={classes} onClose={() => setShowForm(false)} onSaved={load} />
      )}
    </div>
  );
}
