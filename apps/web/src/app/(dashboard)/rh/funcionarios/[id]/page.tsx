'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth.store';
import { ArrowLeft, Fingerprint, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';

const ROLES = ['ADMIN', 'INSTRUCTOR', 'STUDENT', 'PARENT', 'FINANCIAL', 'MANAGER', 'VISITOR', 'GESTOR_RH', 'SUPER_ADMIN'];
const ESTADOS = ['EM_RECRUTAMENTO', 'EM_ADMISSAO', 'ATIVO', 'FERIAS', 'SUSPENSO', 'DESLIGADO'];
const CARGOS = ['INSTRUTOR_NATACAO', 'SALVA_VIDAS', 'RECEPCIONISTA', 'ADMINISTRATIVO', 'COORDENADOR', 'MANUTENCAO', 'OUTRO'];
const DEPARTAMENTOS = ['OPERACOES', 'ADMINISTRATIVO', 'FINANCEIRO', 'MANUTENCAO'];

const TABS = ['Dados', 'Contratos', 'Certificações', 'Escalas', 'Avaliações', 'Férias/Faltas', 'Disciplina', 'Documentos', 'Biometria'];

export default function FuncionarioDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const podeConfigurarPermissoes = isSuperAdmin || user?.role === 'ADMIN';
  const podeVerSalario = user?.role === 'GESTOR_RH' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const rolesDisponiveis = isSuperAdmin ? ROLES : ROLES.filter((r) => r !== 'SUPER_ADMIN');
  const [f, setF] = useState<any>(null);
  const [tab, setTab] = useState('Dados');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [permissoesError, setPermissoesError] = useState('');
  const [unidades, setUnidades] = useState<any[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [savingEdicao, setSavingEdicao] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/rh/funcionarios/${id}`);
      const data = r.data.data || r.data;
      setF(data);
      setRole(data.user?.role || '');
      setEmail(data.user?.email || '');
    } catch (e: any) {
      toast.error('Erro ao carregar funcionário', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { api.get('/unidades').then((r) => setUnidades(r.data.data || r.data)).catch(() => {}); }, []);

  const mudarEstado = async (estado: string) => {
    try {
      await api.put(`/rh/funcionarios/${id}/estado`, { estado });
      toast.success('Estado atualizado');
      load();
    } catch (e: any) {
      toast.error('Erro ao alterar estado', e?.response?.data?.message ?? 'Tenta novamente');
    }
  };

  const salvarPermissoes = async () => {
    setPermissoesError('');
    try {
      await api.put(`/rh/funcionarios/${id}/permissoes`, { role, email });
      toast.success('Permissões atualizadas');
      load();
    } catch (err: any) {
      setPermissoesError(err?.response?.data?.message || 'Erro ao guardar permissões');
      toast.error('Erro ao guardar permissões', err?.response?.data?.message ?? 'Tenta novamente');
    }
  };

  const abrirEdicao = () => {
    setEditForm({
      firstName: f.firstName || '', lastName: f.lastName || '', phone: f.phone || '', biNumero: f.biNumero || '',
      cargo: f.cargo || 'RECEPCIONISTA', departamento: f.departamento || 'OPERACOES',
      dataAdmissao: f.dataAdmissao ? f.dataAdmissao.slice(0, 10) : '',
      contactoEmergencia: f.contactoEmergencia || '', telefoneEmergencia: f.telefoneEmergencia || '',
      salarioBase: f.salarioBase ?? '', unidadeId: f.unidadeId || '',
    });
    setShowEdit(true);
  };

  const salvarEdicao = async () => {
    if (!editForm.firstName || !editForm.lastName || !editForm.cargo) {
      toast.error('Campos obrigatórios', 'Preenche o nome, apelido e cargo');
      return;
    }
    setSavingEdicao(true);
    try {
      await api.put(`/rh/funcionarios/${id}`, {
        ...editForm,
        salarioBase: editForm.salarioBase !== '' ? Number(editForm.salarioBase) : undefined,
        unidadeId: editForm.unidadeId || undefined,
      });
      setShowEdit(false);
      toast.success('Funcionário atualizado');
      load();
    } catch (e: any) {
      toast.error('Erro ao atualizar funcionário', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setSavingEdicao(false);
    }
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
          <button onClick={abrirEdicao} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50">
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
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

          {podeConfigurarPermissoes && (
            <div className="bg-white rounded-xl border border-amber-200 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Permissões de acesso</h3>
              <p className="text-xs text-gray-500">Define o perfil (role) e o email de login do utilizador deste funcionário.</p>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email de login</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2">
                <select value={role} onChange={(e) => setRole(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {rolesDisponiveis.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={salvarPermissoes} disabled={!email} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 disabled:opacity-50">Guardar</button>
              </div>
              {permissoesError && <p className="text-xs text-red-600">{permissoesError}</p>}
            </div>
          )}
        </div>
      )}

      {tab === 'Contratos' && (
        <ListaSimples items={f.contratos} render={(c: any) => (
          <>
            <span className="font-medium">{c.tipo}</span>{c.salarioBase != null && <> · MT {c.salarioBase}</>} · {new Date(c.dataInicio).toLocaleDateString('pt-PT')}
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

      {tab === 'Biometria' && <BiometriaTab funcionarioId={f.id} />}

      {showEdit && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Editar Funcionário</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome*</label>
                <input value={editForm.firstName} onChange={(e) => setEditForm((v: any) => ({ ...v, firstName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apelido*</label>
                <input value={editForm.lastName} onChange={(e) => setEditForm((v: any) => ({ ...v, lastName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input value={editForm.phone} onChange={(e) => setEditForm((v: any) => ({ ...v, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº BI</label>
                <input value={editForm.biNumero} onChange={(e) => setEditForm((v: any) => ({ ...v, biNumero: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo*</label>
                <select value={editForm.cargo} onChange={(e) => setEditForm((v: any) => ({ ...v, cargo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {CARGOS.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <select value={editForm.departamento} onChange={(e) => setEditForm((v: any) => ({ ...v, departamento: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <select value={editForm.unidadeId} onChange={(e) => setEditForm((v: any) => ({ ...v, unidadeId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Nenhuma —</option>
                {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
            <div className={podeVerSalario ? 'grid grid-cols-2 gap-3' : ''}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de admissão</label>
                <input type="date" value={editForm.dataAdmissao} onChange={(e) => setEditForm((v: any) => ({ ...v, dataAdmissao: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              {podeVerSalario && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salário base (MT)</label>
                  <input type="number" value={editForm.salarioBase} onChange={(e) => setEditForm((v: any) => ({ ...v, salarioBase: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contacto de emergência</label>
                <input value={editForm.contactoEmergencia} onChange={(e) => setEditForm((v: any) => ({ ...v, contactoEmergencia: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de emergência</label>
                <input value={editForm.telefoneEmergencia} onChange={(e) => setEditForm((v: any) => ({ ...v, telefoneEmergencia: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowEdit(false)} disabled={savingEdicao} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={salvarEdicao} disabled={!editForm.firstName || !editForm.lastName || !editForm.cargo || savingEdicao}
                className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                {savingEdicao ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BiometriaTab({ funcionarioId }: { funcionarioId: string }) {
  const [credenciais, setCredenciais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/rh/presenca/credenciais/funcionario/${funcionarioId}`);
      setCredenciais(r.data.data || []);
    } catch (e: any) {
      toast.error('Erro ao carregar credenciais', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [funcionarioId]);

  const revogar = async (id: string) => {
    if (!window.confirm('Revogar esta credencial biométrica? Esta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/rh/presenca/credenciais/${id}`);
      toast.success('Credencial revogada');
      load();
    } catch (e: any) {
      toast.error('Erro ao revogar credencial', e?.response?.data?.message ?? 'Tenta novamente');
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-400">A carregar...</div>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        O registo de novas impressões digitais é feito diretamente no computador do quiosque, em <code>/quiosque/enrolar</code>, uma vez que a credencial fica vinculada ao leitor físico daquele computador.
      </p>
      {credenciais.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-200">
          <Fingerprint className="w-8 h-8 mx-auto mb-2 text-gray-300" /> Nenhuma credencial biométrica registada
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {credenciais.map((c: any) => (
            <div key={c.id} className="px-4 py-3 text-sm flex items-center justify-between gap-3">
              <div>
                <span className="font-medium">{c.tipo === 'WEBAUTHN' ? 'Leitor embutido' : 'Leitor USB'}</span>
                {c.dispositivo?.nome && <span className="text-gray-500"> · {c.dispositivo.nome}</span>}
                {c.deviceLabel && <span className="text-gray-500"> · {c.deviceLabel}</span>}
                {c.fabricante && <span className="text-gray-500"> · {c.fabricante}</span>}
                <div className="text-xs text-gray-400 mt-0.5">
                  Registado em {new Date(c.registadoEm).toLocaleDateString('pt-PT')}
                  {c.ultimaUtilizacao && ` · Última utilização ${new Date(c.ultimaUtilizacao).toLocaleString('pt-PT')}`}
                </div>
              </div>
              <button onClick={() => revogar(c.id)} title="Revogar" className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
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
