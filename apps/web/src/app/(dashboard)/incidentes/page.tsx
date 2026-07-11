'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, AlertTriangle, CheckCircle, ShieldAlert, Zap } from 'lucide-react';

const TIPOS = ['ACIDENTE_MENOR','ACIDENTE_GRAVE','NEAR_MISS','COMPORTAMENTO','EQUIPAMENTO','INSTALACOES','OUTRO'];
const DIMENSOES = ['FISICA','OPERACIONAL','EMOCIONAL','PEDAGOGICA'];
const ESTADOS_CORES: Record<string, string> = {
  REPORTADO:'bg-red-100 text-red-700',
  EM_INVESTIGACAO:'bg-yellow-100 text-yellow-700',
  RESOLVIDO:'bg-green-100 text-green-700',
  FECHADO:'bg-gray-100 text-gray-600',
};
const DIM_CORES: Record<string, string> = {
  FISICA:'bg-red-100 text-red-700',
  OPERACIONAL:'bg-blue-100 text-blue-700',
  EMOCIONAL:'bg-purple-100 text-purple-700',
  PEDAGOGICA:'bg-green-100 text-green-700',
};

export default function IncidentesPage() {
  const [incidentes, setIncidentes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [protocolos, setProtocolos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [relampagoConfirm, setRelampagoConfirm] = useState(false);
  const [form, setForm] = useState({
    tipo: 'ACIDENTE_MENOR',
    tipoOcorrencia: 'INCIDENTE_CONFIRMADO',
    dimensoes: [] as string[],
    protocoloId: '',
    descricao: '',
    acaoImediata: '',
    envolvidos: '[]',
  });

  const load = async () => {
    setLoading(true);
    const [inc, s] = await Promise.all([api.get('/incidentes'), api.get('/incidentes/stats')]);
    setIncidentes(inc.data.data || inc.data);
    setStats(s.data.data || s.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get('/protocolos').then(r => setProtocolos(r.data.data || r.data)).catch(() => {});
  }, []);

  const salvar = async () => {
    await api.post('/incidentes', form);
    setShowForm(false);
    setForm({ tipo:'ACIDENTE_MENOR', tipoOcorrencia:'INCIDENTE_CONFIRMADO', dimensoes:[], protocoloId:'', descricao:'', acaoImediata:'', envolvidos:'[]' });
    load();
  };

  const acionarRelampago = async () => {
    await api.post('/incidentes/relampago');
    setRelampagoConfirm(false);
    load();
  };

  const atualizar = async (id: string, estado: string) => {
    await api.put(`/incidentes/${id}`, { estado });
    load();
  };

  const toggleDimensao = (d: string) => {
    setForm(f => ({
      ...f,
      dimensoes: f.dimensoes.includes(d) ? f.dimensoes.filter(x => x !== d) : [...f.dimensoes, d],
    }));
  };

  const parseDims = (json: string): string[] => { try { return JSON.parse(json || '[]'); } catch { return []; } };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Incidentes e Segurança</h1>
          <p className="text-gray-500 text-sm mt-1">Registo e acompanhamento de incidentes e quase-incidentes (SOP 09) — Meta: 0 incidentes graves</p>
        </div>
        <div className="flex gap-2">
          {/* Relâmpago Zero — botão de emergência */}
          <button onClick={() => setRelampagoConfirm(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-bold shadow-lg shadow-red-200">
            <Zap className="w-4 h-4" /> RELÂMPAGO
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
            <Plus className="w-4 h-4" /> Reportar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className={`rounded-xl p-4 ${stats.zerado ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            {stats.zerado ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
            <span className="text-xs font-medium text-gray-600">KPI Graves</span>
          </div>
          <div className={`text-sm font-bold ${stats.zerado ? 'text-green-700' : 'text-red-700'}`}>{stats.zerado ? '✓ Meta OK' : '✗ Com graves'}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-800">{stats.confirmados || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Confirmados</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <div className="text-2xl font-bold text-amber-700">{stats.quaseIncidentes || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Quase-incidentes</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{stats.abertos || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Em aberto</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="text-2xl font-bold text-red-700">{stats.graves || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Graves</div>
        </div>
      </div>

      {/* Lista */}
      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="space-y-3">
          {incidentes.length === 0 && (
            <div className="text-center py-12 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-medium">Nenhum incidente registado</p>
            </div>
          )}
          {incidentes.map((i: any) => {
            const dims = parseDims(i.dimensoes);
            return (
              <div key={i.id} className={`bg-white rounded-xl border p-5 ${i.isRelampago ? 'border-red-400' : 'border-gray-200'}`}>
                {i.isRelampago && (
                  <div className="flex items-center gap-2 mb-2 text-red-600">
                    <Zap className="w-4 h-4" /><span className="text-xs font-bold">RELÂMPAGO ZERO — Evacuação acionada</span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_CORES[i.estado]}`}>{i.estado}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${i.tipoOcorrencia === 'QUASE_INCIDENTE' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                        {i.tipoOcorrencia === 'QUASE_INCIDENTE' ? '⚠ Quase-incidente' : i.tipo.replace(/_/g, ' ')}
                      </span>
                      {dims.map((d: string) => (
                        <span key={d} className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${DIM_CORES[d]}`}>{d}</span>
                      ))}
                      {i.protocolo && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                          Protocolo #{i.protocolo.ranking}: {i.protocolo.nome.split('—')[0].trim()}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{new Date(i.data).toLocaleDateString('pt-PT')}</span>
                      {i.unidade && <span className="text-xs text-gray-400">{i.unidade.codigo}</span>}
                    </div>
                    <p className="text-sm text-gray-800 font-medium mb-1">{i.descricao}</p>
                    <p className="text-sm text-gray-500"><strong>Ação imediata:</strong> {i.acaoImediata}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {i.estado === 'REPORTADO' && <button onClick={() => atualizar(i.id, 'EM_INVESTIGACAO')} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200">Investigar</button>}
                    {i.estado === 'EM_INVESTIGACAO' && <button onClick={() => atualizar(i.id, 'RESOLVIDO')} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">Resolver</button>}
                    {i.estado === 'RESOLVIDO' && <button onClick={() => atualizar(i.id, 'FECHADO')} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200">Fechar</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Relâmpago Zero */}
      {relampagoConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 border-4 border-red-500">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-red-600" />
              <h2 className="text-xl font-bold text-red-700">RELÂMPAGO ZERO</h2>
            </div>
            <p className="text-sm text-gray-700">Acionar protocolo de evacuação imediata da piscina por relâmpago/trovão.</p>
            <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700 font-medium">
              O registo será criado automaticamente. A supervisão será notificada depois da ação — não antes.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRelampagoConfirm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancelar</button>
              <button onClick={acionarRelampago} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-red-700">
                EVACUAR AGORA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal reportar */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-bold text-gray-900">Reportar Ocorrência</h2>
            </div>

            {/* Tipo de ocorrência */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Ocorrência*</label>
              <div className="flex gap-2">
                {[
                  { v: 'INCIDENTE_CONFIRMADO', label: 'Incidente Confirmado', cls: 'border-red-400 bg-red-50 text-red-700' },
                  { v: 'QUASE_INCIDENTE', label: '⚠ Quase-Incidente', cls: 'border-amber-400 bg-amber-50 text-amber-700' },
                ].map(({ v, label, cls }) => (
                  <button key={v} onClick={() => setForm(f => ({ ...f, tipoOcorrencia: v }))}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${form.tipoOcorrencia === v ? cls : 'border-gray-200 text-gray-500'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dimensões */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dimensão(ões) de risco* <span className="text-xs font-normal text-gray-400">(selecionar pelo menos uma)</span></label>
              <div className="flex gap-2 flex-wrap">
                {DIMENSOES.map(d => (
                  <button key={d} onClick={() => toggleDimensao(d)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${form.dimensoes.includes(d) ? DIM_CORES[d] + ' border-current' : 'border-gray-200 text-gray-500'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo categorização */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {TIPOS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>

            {/* Protocolo relacionado */}
            {protocolos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Protocolo relacionado (opcional)</label>
                <select value={form.protocoloId} onChange={e => setForm(f => ({ ...f, protocoloId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">— Nenhum —</option>
                  {protocolos.map((p: any) => <option key={p.id} value={p.id}>#{p.ranking} — {p.nome}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do ocorrido*</label>
              <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ação imediata tomada*</label>
              <textarea value={form.acaoImediata} onChange={e => setForm(f => ({ ...f, acaoImediata: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.descricao || !form.acaoImediata || form.dimensoes.length === 0}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                Reportar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
