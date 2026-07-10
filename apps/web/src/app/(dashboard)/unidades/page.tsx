'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Building2, MapPin, Users, Phone, Plus } from 'lucide-react';

const ESTADO_CORES: Record<string, string> = { ATIVA:'bg-green-100 text-green-700', INATIVA:'bg-gray-100 text-gray-500', SUSPENSO:'bg-red-100 text-red-700' };

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome:'', codigo:'', endereco:'', cidade:'', telefone:'', email:'', capacidade:'' });

  const load = async () => {
    setLoading(true);
    const r = await api.get('/unidades');
    setUnidades(r.data.data || r.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const salvar = async () => {
    await api.post('/unidades', { ...form, capacidade: form.capacidade ? Number(form.capacidade) : undefined });
    setShowForm(false);
    setForm({ nome:'', codigo:'', endereco:'', cidade:'', telefone:'', email:'', capacidade:'' });
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADO_CORES[u.estado] || 'bg-gray-100 text-gray-500'}`}>{u.estado}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  {u.cidade && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{u.cidade}{u.endereco ? ` — ${u.endereco}` : ''}</div>}
                  {u.telefone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{u.telefone}</div>}
                  {u.capacidade && <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" />Capacidade: {u.capacidade} alunos</div>}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xl font-bold text-gray-800">{u._count?.students || 0}</div>
                    <div className="text-xs text-gray-400">Alunos</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-800">{u._count?.classes || 0}</div>
                    <div className="text-xs text-gray-400">Turmas</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-800">{u._count?.instructors || 0}</div>
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
            {[
              { label:'Nome*', key:'nome', type:'text' },
              { label:'Código*', key:'codigo', type:'text', placeholder:'Ex: CCBM' },
              { label:'Cidade', key:'cidade', type:'text' },
              { label:'Endereço', key:'endereco', type:'text' },
              { label:'Telefone', key:'telefone', type:'tel' },
              { label:'Email', key:'email', type:'email' },
              { label:'Capacidade (nº alunos)', key:'capacidade', type:'number' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} placeholder={placeholder} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.nome || !form.codigo} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
