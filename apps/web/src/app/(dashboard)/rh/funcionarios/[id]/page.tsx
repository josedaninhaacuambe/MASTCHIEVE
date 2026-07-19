'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const ROLES = ['ADMIN', 'INSTRUCTOR', 'STUDENT', 'PARENT', 'FINANCIAL', 'MANAGER', 'VISITOR', 'GESTOR_RH', 'SUPER_ADMIN'];
const ESTADOS = ['EM_RECRUTAMENTO', 'EM_ADMISSAO', 'ATIVO', 'FERIAS', 'SUSPENSO', 'DESLIGADO'];

const TABS = ['Dados', 'Contratos', 'Certificações', 'Escalas', 'Avaliações', 'Férias/Faltas', 'Disciplina', 'Documentos'];

export default function FuncionarioDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [f, setF] = useState<any>(null);
  const [tab, setTab] = useState('Dados');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');

  const load = async () => {
    setLoading(true);
    const r = await api.get(`/rh/funcionarios/${id}`);
    const data = r.data.data || r.data;
    setF(data);
    setRole(data.user?.role || '');
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const mudarEstado = async (estado: string) => {
    await api.put(`/rh/funcionarios/${id}/estado`, { estado });
    load();
  };

  const salvarPermissoes = async () => {
    await api.put(`/rh/funcionarios/${id}/permissoes`, { role });
    load();
  };

  if (loading) return <div className="text-center py-12 text-gray-400">A carregar...</div>;
  if (!f) return <div className="text-center py-12 text-gray-400">Funcionário não encontrado</div>;

  return (
    <div className="p-6 space-y-6">
      <Link href="/rh/funcionarios" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 w-fit">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{f.firstName} {f.lastName}</h1>
          <p className="text-gray-500 text-sm mt-1">{f.numeroFuncionario} · {f.cargo?.replace(/_/g, ' ')} · {f.user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{f.estado?.replace(/_/g, ' ')}</span>
          <select value="" onChange={(e) => e.target.value && mudarEstado(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs">
            <option value="">Alterar estado...</option>
            {ESTADOS.filter(e => e !== f.estado).map(e => <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition ${tab === t ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Dados' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Telefone</span><span className="font-medium">{f.phone || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Nº BI</span><span className="font-medium">{f.biNumero || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Departamento</span><span className="font-medium">{f.departamento}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Data admissão</span><span className="font-medium">{f.dataAdmissao ? new Date(f.dataAdmissao).toLocaleDateString('pt-PT') : '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Salário base</span><span className="font-medium">{f.salarioBase ? `MT ${f.salarioBase}` : '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Unidade</span><span className="font-medium">{f.unidade?.nome || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Contacto emergência</span><span className="font-medium">{f.contactoEmergencia || '—'} {f.telefoneEmergencia ? `(${f.telefoneEmergencia})` : ''}</span></div>
          </div>

          {isSuperAdmin && (
            <div className="bg-white rounded-xl border border-amber-200 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Permissões de acesso (Super Admin)</h3>
              <p className="text-xs text-gray-500">Define o perfil (role) de sistema associado ao utilizador deste funcionário.</p>
              <div className="flex gap-2">
                <select value={role} onChange={(e) => setRole(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={salvarPermissoes} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900">Guardar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Contratos' && (
        <ListaSimples items={f.contratos} render={(c: any) => (
          <>
            <span className="font-medium">{c.tipo}</span> · MT {c.salarioBase} · {new Date(c.dataInicio).toLocaleDateString('pt-PT')}
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{c.estado}</span>
          </>
        )} vazio="Sem contratos" />
      )}

      {tab === 'Certificações' && (
        <ListaSimples items={f.certificacoes} render={(c: any) => (
          <>
            <span className="font-medium">{c.tipo}</span> · validade {c.dataValidade ? new Date(c.dataValidade).toLocaleDateString('pt-PT') : '—'}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${c.estado === 'ATIVA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.estado}</span>
          </>
        )} vazio="Sem certificações" />
      )}

      {tab === 'Escalas' && (
        <ListaSimples items={f.escalas} render={(e: any) => (
          <>{new Date(e.data).toLocaleDateString('pt-PT')} · {e.turno} · {e.horaInicio}-{e.horaFim} · <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{e.estado}</span></>
        )} vazio="Sem escalas futuras" />
      )}

      {tab === 'Avaliações' && (
        <ListaSimples items={f.avaliacoesDesempenho} render={(a: any) => (
          <>{a.periodo} · pontuação {a.pontuacaoGeral ?? '—'} · <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{a.estado}</span></>
        )} vazio="Sem avaliações" />
      )}

      {tab === 'Férias/Faltas' && (
        <ListaSimples items={f.feriasFaltas} render={(x: any) => (
          <>{x.tipo} · {new Date(x.dataInicio).toLocaleDateString('pt-PT')} - {new Date(x.dataFim).toLocaleDateString('pt-PT')} · <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{x.estado}</span></>
        )} vazio="Sem registos" />
      )}

      {tab === 'Disciplina' && (
        <ListaSimples items={f.ocorrenciasDisciplinares} render={(o: any) => (
          <>{o.tipo} · gravidade {o.gravidade} · <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{o.estado}</span></>
        )} vazio="Sem ocorrências" />
      )}

      {tab === 'Documentos' && (
        <ListaSimples items={f.documentos} render={(d: any) => (
          <>
            <a href={d.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline font-medium">{d.nome}</a>
            {' '}· {d.tipo} · <span className={`px-2 py-0.5 rounded-full text-xs ${d.validado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{d.validado ? 'Validado' : 'Pendente'}</span>
          </>
        )} vazio="Sem documentos" />
      )}
    </div>
  );
}

function ListaSimples({ items, render, vazio }: { items: any[]; render: (item: any) => React.ReactNode; vazio: string }) {
  if (!items || items.length === 0) return <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-200">{vazio}</div>;
  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      {items.map((item: any) => (
        <div key={item.id} className="px-4 py-3 text-sm text-gray-700">{render(item)}</div>
      ))}
    </div>
  );
}
