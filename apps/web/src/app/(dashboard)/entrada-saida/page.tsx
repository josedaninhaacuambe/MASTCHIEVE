'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatDate, cn } from '@/lib/utils';
import { Plus, LogIn, LogOut, DoorOpen, XCircle, Users } from 'lucide-react';
import { BulkEntradaSaidaModal } from './bulk-modal';
import { StudentSearchSelect } from '@/components/ui/student-search-select';

export default function EntradaSaidaPage() {
  const [registos, setRegistos] = useState<any[]>([]);
  const [pessoasAutorizadas, setPessoasAutorizadas] = useState<any[]>([]);
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [form, setForm] = useState({ studentId: '', tipo: 'ENTRADA', pessoaAutorizadaId: '', justificativa: '', hora: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (data) params.data = data;
      const r = await api.get('/entrada-saida/registos', { params });
      setRegistos(r.data.data ?? []);
      setLoadError(false);
    } catch (e: any) {
      setLoadError(true);
      toast.error('Erro ao carregar registos', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [data]);

  useEffect(() => {
    if (!form.studentId) { setPessoasAutorizadas([]); return; }
    api.get(`/entrada-saida/pessoas-autorizadas/${form.studentId}`).then((r) => setPessoasAutorizadas(r.data.data ?? [])).catch(() => setPessoasAutorizadas([]));
  }, [form.studentId]);

  const abrirNovo = () => {
    setForm({ studentId: '', tipo: 'ENTRADA', pessoaAutorizadaId: '', justificativa: '', hora: '' });
    setShowForm(true);
  };

  const salvar = async () => {
    setSaving(true);
    try {
      await api.post('/entrada-saida/registos', {
        studentId: form.studentId,
        tipo: form.tipo,
        pessoaAutorizadaId: form.tipo === 'SAIDA' ? (form.pessoaAutorizadaId || undefined) : undefined,
        justificativa: form.tipo !== 'ENTRADA' ? (form.justificativa || undefined) : undefined,
        dataHora: form.hora ? new Date(form.hora).toISOString() : undefined,
      });
      toast.success('Registo criado');
      setShowForm(false);
      load();
    } catch (e: any) {
      toast.error('Erro ao registar', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setSaving(false);
    }
  };

  const formValido = form.tipo !== 'CANCELAMENTO' || !!form.justificativa.trim();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entrada e Saída dos Alunos</h1>
          <p className="text-gray-500 text-sm mt-1">Controlo de entradas e saídas dos atletas</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <button onClick={() => setShowBulkForm(true)} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <Users className="w-4 h-4" /> Registo em Grupo (Turma)
          </button>
          <button onClick={abrirNovo} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
            <Plus className="w-4 h-4" /> Registar
          </button>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            Erro ao carregar registos. Verifica a ligação ao servidor.
          </div>
          <button onClick={() => load()} className="text-xs text-red-600 hover:underline">
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">A carregar...</div>
      ) : registos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <DoorOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Nenhum registo encontrado
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Data/Hora</th>
                <th className="text-left px-4 py-3">Atleta</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Pessoa Autorizada / Justificação</th>
                <th className="text-left px-4 py-3">Registado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registos.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(r.dataHora, 'dd/MM/yyyy HH:mm')}
                    {Math.abs(new Date(r.dataHora).getTime() - new Date(r.createdAt).getTime()) > 60_000 && (
                      <span title={`Lançado em ${formatDate(r.createdAt, 'dd/MM/yyyy HH:mm')}`} className="ml-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">Manual</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.student?.firstName} {r.student?.lastName}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit',
                      r.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : r.tipo === 'CANCELAMENTO' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                      {r.tipo === 'ENTRADA' ? <LogIn className="w-3 h-3" /> : r.tipo === 'CANCELAMENTO' ? <XCircle className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                      {r.tipo === 'ENTRADA' ? 'Entrada' : r.tipo === 'CANCELAMENTO' ? 'Cancelamento' : 'Saída'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.pessoaAutorizada ? `${r.pessoaAutorizada.nome} (${r.pessoaAutorizada.parentesco})` : (r.justificativa ?? '—')}</td>
                  <td className="px-4 py-3 text-gray-500">{r.registadoPor?.email ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Registar Entrada/Saída</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Atleta*</label>
              <StudentSearchSelect value={form.studentId} onChange={(id) => setForm((f) => ({ ...f, studentId: id, pessoaAutorizadaId: '' }))} />
            </div>
            <div className="flex gap-2">
              {(['ENTRADA', 'SAIDA', 'CANCELAMENTO'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, tipo: t }))}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border flex items-center justify-center gap-1.5',
                    form.tipo === t
                      ? t === 'CANCELAMENTO' ? 'bg-red-600 text-white border-red-600' : 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-600 border-gray-200',
                  )}
                >
                  {t === 'ENTRADA' ? <LogIn className="w-4 h-4" /> : t === 'CANCELAMENTO' ? <XCircle className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                  {t === 'ENTRADA' ? 'Entrada' : t === 'CANCELAMENTO' ? 'Cancelamento' : 'Saída'}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input type="datetime-local" value={form.hora} onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <p className="text-xs text-gray-400 mt-1">Em branco usa a hora actual. Indica a hora real ao lançar um registo anotado antes (até 7 dias).</p>
            </div>
            {form.tipo === 'CANCELAMENTO' && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                Usa esta opção quando o atleta chegou à escola mas teve de sair antes da aula começar (ex: emergência). A justificação é obrigatória.
              </p>
            )}
            {(form.tipo === 'SAIDA' || form.tipo === 'CANCELAMENTO') && (
              <>
                {form.tipo === 'SAIDA' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa Autorizada</label>
                    <select value={form.pessoaAutorizadaId} onChange={(e) => setForm((f) => ({ ...f, pessoaAutorizadaId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" disabled={!form.studentId}>
                      <option value="">— Nenhuma —</option>
                      {pessoasAutorizadas.map((p: any) => <option key={p.id} value={p.id}>{p.nome} ({p.parentesco})</option>)}
                    </select>
                    {form.studentId && pessoasAutorizadas.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">Sem pessoas autorizadas registadas para este atleta.</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.tipo === 'CANCELAMENTO' ? 'Justificação*' : <>Observação <span className="text-gray-400 font-normal">(opcional)</span></>}
                  </label>
                  <textarea value={form.justificativa} onChange={(e) => setForm((f) => ({ ...f, justificativa: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder={form.tipo === 'CANCELAMENTO' ? 'Ex: mal-estar súbito, emergência familiar...' : 'Ex: saiu mais cedo a pedido do encarregado'} />
                </div>
              </>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.studentId || !formValido || saving} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                {saving ? 'A registar...' : 'Registar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkForm && (
        <BulkEntradaSaidaModal onClose={() => setShowBulkForm(false)} onSaved={() => { setShowBulkForm(false); load(); }} />
      )}
    </div>
  );
}
