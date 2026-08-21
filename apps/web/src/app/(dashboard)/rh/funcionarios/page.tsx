'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, Users, Search } from 'lucide-react';
import { ResponsiveTable } from '@/components/ui/responsive-table';

const CARGOS = ['INSTRUTOR_NATACAO', 'SALVA_VIDAS', 'RECEPCIONISTA', 'ADMINISTRATIVO', 'COORDENADOR', 'MANUTENCAO', 'OUTRO'];
const DEPARTAMENTOS = ['OPERACOES', 'ADMINISTRATIVO', 'FINANCEIRO', 'MANUTENCAO'];
const ESTADOS_CORES: Record<string, string> = {
  EM_RECRUTAMENTO: 'bg-gray-100 text-gray-600',
  EM_ADMISSAO: 'bg-blue-100 text-blue-700',
  ATIVO: 'bg-green-100 text-green-700',
  FERIAS: 'bg-amber-100 text-amber-700',
  SUSPENSO: 'bg-red-100 text-red-700',
  DESLIGADO: 'bg-gray-200 text-gray-500',
};

export default function FuncionariosPage() {
  const { user } = useAuthStore();
  const podeVerSalario = user?.role === 'GESTOR_RH' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: '', biNumero: '',
    cargo: 'RECEPCIONISTA', departamento: 'OPERACOES', dataAdmissao: '', salarioBase: '',
  });

  const load = async () => {
    setLoading(true);
    const r = await api.get('/rh/funcionarios', { params: { search: search || undefined } });
    setData(r.data.data?.data || r.data.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const salvar = async () => {
    await api.post('/rh/funcionarios', { ...form, salarioBase: form.salarioBase ? Number(form.salarioBase) : undefined });
    setShowForm(false);
    setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', biNumero: '', cargo: 'RECEPCIONISTA', departamento: 'OPERACOES', dataAdmissao: '', salarioBase: '' });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funcionários</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão do quadro de pessoal — admissão e ficha individual</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
          <Plus className="w-4 h-4" /> Admitir Funcionário
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por nome ou número..."
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm" />
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {data.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              Nenhum funcionário registado
            </div>
          ) : (
            <ResponsiveTable>
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Nº</th>
                  <th className="text-left px-4 py-3">Nome</th>
                  <th className="text-left px-4 py-3">Cargo</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((f: any) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{f.numeroFuncionario}</td>
                    <td className="px-4 py-3">
                      <Link href={`/rh/funcionarios/${f.id}`} className="font-medium text-blue-700 hover:underline whitespace-nowrap">
                        {f.firstName} {f.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{f.cargo.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{f.user?.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${ESTADOS_CORES[f.estado] || 'bg-gray-100 text-gray-600'}`}>{f.estado.replace(/_/g, ' ')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </ResponsiveTable>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Admitir Funcionário</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome*</label>
                <input value={form.firstName} onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apelido*</label>
                <input value={form.lastName} onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
              <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password inicial (opcional)</label>
              <input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Gerada automaticamente se vazio" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº BI</label>
                <input value={form.biNumero} onChange={(e) => setForm(f => ({ ...f, biNumero: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo*</label>
                <select value={form.cargo} onChange={(e) => setForm(f => ({ ...f, cargo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {CARGOS.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <select value={form.departamento} onChange={(e) => setForm(f => ({ ...f, departamento: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className={podeVerSalario ? 'grid grid-cols-2 gap-3' : ''}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de admissão</label>
                <input type="date" value={form.dataAdmissao} onChange={(e) => setForm(f => ({ ...f, dataAdmissao: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              {podeVerSalario && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salário base (MT)</label>
                  <input type="number" value={form.salarioBase} onChange={(e) => setForm(f => ({ ...f, salarioBase: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.email || !form.firstName || !form.lastName || !form.cargo}
                className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                Admitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
