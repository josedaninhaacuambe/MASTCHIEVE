'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Plus, Calendar, MapPin, Users, Award, ClipboardList, X, Check, Trash2, Search } from 'lucide-react';

const ESTADOS_CORES: Record<string, string> = { PLANEADO:'bg-blue-100 text-blue-700', REALIZADO:'bg-green-100 text-green-700', CANCELADO:'bg-red-100 text-red-700' };

function parseChecklist(raw: string | null | undefined): { texto: string; checked: boolean }[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function EventoManageModal({ evento, onClose, onSaved }: { evento: any; onClose: () => void; onSaved: () => void }) {
  const [checklist, setChecklist] = useState<{ texto: string; checked: boolean }[]>(parseChecklist(evento.checklistMateriais));
  const [novoItem, setNovoItem] = useState('');
  const [savingChecklist, setSavingChecklist] = useState(false);

  const [participantes, setParticipantes] = useState<any[]>([]);
  const [loadingParticipantes, setLoadingParticipantes] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [nomeManual, setNomeManual] = useState('');
  const [contactoManual, setContactoManual] = useState('');

  const loadParticipantes = async () => {
    setLoadingParticipantes(true);
    try {
      const r = await api.get(`/eventos/${evento.id}/participantes`);
      setParticipantes(r.data.data || r.data);
    } catch (e: any) {
      toast.error('Erro ao carregar participantes', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoadingParticipantes(false);
    }
  };

  useEffect(() => { loadParticipantes(); }, []);

  useEffect(() => {
    if (!studentSearch) { setStudentResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/students?search=${encodeURIComponent(studentSearch)}&limit=6`);
        setStudentResults(r.data.data ?? []);
      } catch {
        setStudentResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch]);

  const salvarChecklist = async (next: { texto: string; checked: boolean }[]) => {
    const previous = checklist;
    setChecklist(next);
    setSavingChecklist(true);
    try {
      await api.put(`/eventos/${evento.id}`, { checklistMateriais: JSON.stringify(next) });
      onSaved();
    } catch (e: any) {
      setChecklist(previous);
      toast.error('Erro ao guardar checklist', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setSavingChecklist(false);
    }
  };

  const adicionarItem = () => {
    if (!novoItem.trim()) return;
    salvarChecklist([...checklist, { texto: novoItem.trim(), checked: false }]);
    setNovoItem('');
  };

  const toggleItem = (i: number) => {
    salvarChecklist(checklist.map((it, idx) => idx === i ? { ...it, checked: !it.checked } : it));
  };

  const removerItem = (i: number) => {
    salvarChecklist(checklist.filter((_, idx) => idx !== i));
  };

  const adicionarParticipanteStudent = async (studentId: string) => {
    try {
      await api.post(`/eventos/${evento.id}/participantes`, { studentId });
      setStudentSearch('');
      setStudentResults([]);
      loadParticipantes();
    } catch (e: any) {
      toast.error('Erro ao adicionar participante', e?.response?.data?.message ?? 'Tenta novamente');
    }
  };

  const adicionarParticipanteManual = async () => {
    if (!nomeManual.trim()) {
      toast.error('Campo obrigatório', 'Indica o nome do participante');
      return;
    }
    try {
      await api.post(`/eventos/${evento.id}/participantes`, { nome: nomeManual.trim(), contacto: contactoManual || undefined });
      setNomeManual('');
      setContactoManual('');
      loadParticipantes();
    } catch (e: any) {
      toast.error('Erro ao adicionar participante', e?.response?.data?.message ?? 'Tenta novamente');
    }
  };

  const marcarPresenca = async (participanteId: string, presente: boolean) => {
    try {
      await api.put(`/eventos/participantes/${participanteId}/presenca`, { presente });
      loadParticipantes();
    } catch (e: any) {
      toast.error('Erro ao marcar presença', e?.response?.data?.message ?? 'Tenta novamente');
    }
  };

  const removerParticipante = async (participanteId: string) => {
    try {
      await api.delete(`/eventos/participantes/${participanteId}`);
      loadParticipantes();
    } catch (e: any) {
      toast.error('Erro ao remover participante', e?.response?.data?.message ?? 'Tenta novamente');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{evento.nome}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Participantes e checklist de materiais</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-6">
          {/* Checklist de materiais */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" /> Checklist de Materiais
            </h3>
            <div className="space-y-1.5">
              {checklist.length === 0 && <p className="text-xs text-gray-400">Nenhum item na checklist</p>}
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <button onClick={() => toggleItem(i)}
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${item.checked ? 'bg-green-600 border-green-600' : 'border-gray-300 bg-white'}`}>
                    {item.checked && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <span className={`flex-1 text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.texto}</span>
                  <button onClick={() => removerItem(i)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input value={novoItem} onChange={e => setNovoItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') adicionarItem(); }}
                placeholder="Novo item... (ex: Fitas de largada)"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              <button onClick={adicionarItem} disabled={!novoItem.trim() || savingChecklist}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">Adicionar</button>
            </div>
          </div>

          {/* Participantes */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> Participantes ({participantes.length})
            </h3>

            {loadingParticipantes ? (
              <p className="text-xs text-gray-400">A carregar...</p>
            ) : (
              <div className="space-y-1.5 mb-3">
                {participantes.length === 0 && <p className="text-xs text-gray-400">Nenhum participante registado</p>}
                {participantes.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {p.student ? `${p.student.firstName} ${p.student.lastName}` : p.nome}
                      </p>
                      {p.contacto && <p className="text-xs text-gray-400">{p.contacto}</p>}
                    </div>
                    <button onClick={() => marcarPresenca(p.id, !p.presente)}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${p.presente ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {p.presente ? 'Presente' : 'Marcar presença'}
                    </button>
                    <button onClick={() => removerParticipante(p.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <div>
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Pesquisar atleta para adicionar..." className="flex-1 text-sm outline-none" />
                </div>
                {studentResults.length > 0 && (
                  <div className="mt-1 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-32 overflow-y-auto">
                    {studentResults.map((s: any) => (
                      <button key={s.id} type="button" onClick={() => adicionarParticipanteStudent(s.id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                        {s.firstName} {s.lastName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input value={nomeManual} onChange={e => setNomeManual(e.target.value)} placeholder="Ou nome (visitante)..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
                <input value={contactoManual} onChange={e => setContactoManual(e.target.value)} placeholder="Contacto"
                  className="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
                <button onClick={adicionarParticipanteManual} disabled={!nomeManual.trim()}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventosPage() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [manageEvento, setManageEvento] = useState<any | null>(null);
  const [form, setForm] = useState({ nome:'', tipo:'OPEN_DAY', data:'', programa:'', capacidade:'', notas:'' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/eventos');
      setEventos(r.data.data || r.data);
    } catch (e: any) {
      toast.error('Erro ao carregar eventos', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const salvar = async () => {
    if (!form.nome.trim() || !form.data) {
      toast.error('Campos obrigatórios', 'Preenche o nome e a data do evento');
      return;
    }
    setSaving(true);
    try {
      await api.post('/eventos', { ...form, capacidade: form.capacidade ? Number(form.capacidade) : undefined, data: new Date(form.data).toISOString() });
      setShowForm(false);
      setForm({ nome:'', tipo:'OPEN_DAY', data:'', programa:'', capacidade:'', notas:'' });
      toast.success('Evento criado');
      load();
    } catch (e: any) {
      toast.error('Erro ao criar evento', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setSaving(false);
    }
  };

  const atualizar = async (id: string, estado: string) => {
    try {
      await api.put(`/eventos/${id}`, { estado });
      load();
    } catch (e: any) {
      toast.error('Erro ao atualizar evento', e?.response?.data?.message ?? 'Tenta novamente');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos e Open Days</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de Open Days, entregas de certificados e eventos (SOP 07)</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Novo Evento
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventos.length === 0 && (
            <div className="col-span-3 text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Nenhum evento registado</p>
            </div>
          )}
          {eventos.map((e: any) => (
            <div key={e.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className={`px-5 pt-5 pb-4`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-gray-400 font-medium">{e.tipo.replace('_', ' ')}</span>
                    <h3 className="font-bold text-gray-900 text-lg mt-0.5">{e.nome}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_CORES[e.estado]}`}>{e.estado}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{new Date(e.data).toLocaleDateString('pt-PT', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
                  {e.unidade && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{e.unidade.nome}</div>}
                  {e.capacidade && <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" />Capacidade: {e.capacidade} pessoas</div>}
                  {e._count && <div className="flex items-center gap-2"><Award className="w-4 h-4 text-gray-400" />{e._count.certificados} certificados</div>}
                </div>
              </div>
              <div className="px-5 pb-4 flex gap-2">
                <button onClick={() => setManageEvento(e)}
                  className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 py-1.5 px-3 rounded-lg hover:bg-blue-100 font-medium">
                  <ClipboardList className="w-3.5 h-3.5" /> Participantes
                </button>
                {e.estado === 'PLANEADO' && <button onClick={() => atualizar(e.id, 'REALIZADO')} className="flex-1 text-xs bg-green-100 text-green-700 py-1.5 rounded-lg hover:bg-green-200 font-medium">Marcar Realizado</button>}
                {e.estado === 'PLANEADO' && <button onClick={() => atualizar(e.id, 'CANCELADO')} className="text-xs bg-red-100 text-red-600 py-1.5 px-3 rounded-lg hover:bg-red-200">Cancelar</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Novo Evento</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="OPEN_DAY">Open Day</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            {[{ label:'Nome*', key:'nome', type:'text' }, { label:'Data*', key:'data', type:'datetime-local' }, { label:'Capacidade', key:'capacidade', type:'number' }].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
              <textarea value={form.programa} onChange={e => setForm(f => ({ ...f, programa: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.nome || !form.data || saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'A criar...' : 'Criar Evento'}</button>
            </div>
          </div>
        </div>
      )}

      {manageEvento && (
        <EventoManageModal evento={manageEvento} onClose={() => setManageEvento(null)} onSaved={load} />
      )}
    </div>
  );
}
