'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Building2, MapPin, Users, Phone, Plus, Trash2, Pencil } from 'lucide-react';

const TIPOS = ['PRINCIPAL', 'COMUNITARIO', 'PREMIUM'];

const emptyForm = { nome: '', codigo: '', tipo: 'PRINCIPAL', endereco: '', contacto: '', email: '' };

function UnidadeFormFields({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  return (
    <>
      {[
        { label: 'Nome*', key: 'nome', type: 'text' },
        { label: 'Código*', key: 'codigo', type: 'text', placeholder: 'Ex: CCBM' },
        { label: 'Endereço', key: 'endereco', type: 'text' },
        { label: 'Contacto (telefone)', key: 'contacto', type: 'tel' },
        { label: 'Email', key: 'email', type: 'email' },
      ].map(({ label, key, type, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input type={type} placeholder={placeholder} value={form[key]} onChange={(e) => setForm((f: any) => ({ ...f, [key]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
        <select value={form.tipo} onChange={(e) => setForm((f: any) => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </>
  );
}

function EditUnidadeModal({ unidade, onClose, onSaved }: { unidade: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    nome: unidade.nome || '', codigo: unidade.codigo || '', tipo: unidade.tipo || 'PRINCIPAL',
    endereco: unidade.endereco || '', contacto: unidade.contacto || '', email: unidade.email || '',
  });
  const [ativo, setAtivo] = useState<boolean>(unidade.ativo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const guardar = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/unidades/${unidade.id}`, { ...form, ativo });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao guardar alterações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Editar Unidade</h2>
        <UnidadeFormFields form={form} setForm={setForm} />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="rounded border-gray-300" />
          Unidade ativa
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
          <button onClick={guardar} disabled={saving || !form.nome || !form.codigo} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const r = await api.get('/unidades');
    setUnidades(r.data.data || r.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const apagar = async (u: any) => {
    if (!window.confirm(`Apagar a unidade "${u.nome}"? Esta ação pode ser revertida por um administrador.`)) return;
    await api.delete(`/unidades/${u.id}`);
    load();
  };

  const salvar = async () => {
    await api.post('/unidades', form);
    setShowForm(false);
    setForm(emptyForm);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unidades Mastchieve</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão multi-unidade: CCBM-Matola, Oscar's Club-Jardim, Hotel Polana</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Nova Unidade
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unidades.length === 0 && (
            <div className="col-span-3 text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Nenhuma unidade registada</p>
            </div>
          )}
          {unidades.map((u: any) => (
            <div key={u.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-2 bg-gradient-to-r from-teal-400 to-cyan-500" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs text-teal-600 font-bold tracking-wider">{u.codigo}</span>
                    <h3 className="font-bold text-gray-900 text-lg mt-0.5">{u.nome}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{u.ativo ? 'Ativa' : 'Inativa'}</span>
                    <button onClick={() => setEditing(u)} title="Editar unidade" className="p-1.5 text-gray-300 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => apagar(u)} title="Apagar unidade" className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  {u.endereco && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{u.endereco}</div>}
                  {u.contacto && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{u.contacto}</div>}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xl font-bold text-gray-800">{u._count?.estudantes || 0}</div>
                    <div className="text-xs text-gray-400">Alunos</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-800">{u._count?.turmas || 0}</div>
                    <div className="text-xs text-gray-400">Turmas</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-800">{u._count?.instrutores || 0}</div>
                    <div className="text-xs text-gray-400">Instrutores</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Nova Unidade</h2>
            <UnidadeFormFields form={form} setForm={setForm} />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.nome || !form.codigo} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">Criar</button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <EditUnidadeModal unidade={editing} onClose={() => setEditing(null)} onSaved={load} />
      )}
    </div>
  );
}
