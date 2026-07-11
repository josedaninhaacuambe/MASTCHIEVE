'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ShieldCheck, AlertTriangle, TrendingUp, CheckCircle, XCircle, Bell, BarChart3, Calendar, Clock } from 'lucide-react';

type Tab = 'semanal' | 'mensal' | 'reincidencias';

const DIM_CORES: Record<string, string> = {
  FISICA: 'bg-red-100 text-red-700',
  OPERACIONAL: 'bg-blue-100 text-blue-700',
  EMOCIONAL: 'bg-purple-100 text-purple-700',
  PEDAGOGICA: 'bg-green-100 text-green-700',
  GESTAO: 'bg-gray-100 text-gray-700',
};

export default function SegurancaPage() {
  const [tab, setTab] = useState<Tab>('mensal');
  const [semanal, setSemanal] = useState<any>(null);
  const [mensal, setMensal] = useState<any>(null);
  const [reincidencias, setReincidencias] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadTab = async (t: Tab) => {
    setLoading(true);
    try {
      if (t === 'semanal' && !semanal) {
        const r = await api.get('/seguranca/semanal');
        setSemanal(r.data);
      }
      if (t === 'mensal' && !mensal) {
        const r = await api.get('/seguranca/mensal');
        setMensal(r.data);
      }
      if (t === 'reincidencias' && !reincidencias) {
        const r = await api.get('/seguranca/reincidencias');
        setReincidencias(r.data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadTab(tab); }, [tab]);

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'mensal', label: 'Mensal', icon: BarChart3 },
    { key: 'semanal', label: 'Semanal', icon: Calendar },
    { key: 'reincidencias', label: 'Reincidências', icon: Bell },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Segurança</h1>
          <p className="text-gray-500 text-sm mt-1">Monitoria em 3 níveis: semanal / mensal / reincidências — conforme Documento Consolidado AMA</p>
        </div>
        <ShieldCheck className="w-8 h-8 text-indigo-500" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setTab(key); loadTab(key); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-400">A carregar...</div>}

      {/* ── MENSAL ── */}
      {tab === 'mensal' && mensal && !loading && (
        <div className="space-y-5">
          {/* KPI meta */}
          <div className={`rounded-2xl p-5 border-2 ${mensal.metaZeroGraves ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
            <div className="flex items-center gap-3">
              {mensal.metaZeroGraves
                ? <CheckCircle className="w-8 h-8 text-green-600" />
                : <XCircle className="w-8 h-8 text-red-600" />}
              <div>
                <div className={`text-lg font-bold ${mensal.metaZeroGraves ? 'text-green-700' : 'text-red-700'}`}>
                  {mensal.metaZeroGraves ? '✓ Meta atingida — 0 incidentes graves este mês' : `✗ ${mensal.totais.graves} incidente(s) grave(s) este mês`}
                </div>
                <div className="text-sm text-gray-500">
                  {mensal.totais.incidentes} incidentes confirmados · {mensal.totais.quaseIncidentes} quase-incidentes registados
                </div>
              </div>
            </div>
          </div>

          {/* Stats por tipo */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-3xl font-bold text-gray-800">{mensal.totais.incidentes}</div>
              <div className="text-sm text-gray-500 mt-1">Incidentes confirmados</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="text-3xl font-bold text-amber-700">{mensal.totais.quaseIncidentes}</div>
              <div className="text-sm text-gray-500 mt-1">Quase-incidentes</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="text-3xl font-bold text-red-700">{mensal.totais.graves}</div>
              <div className="text-sm text-gray-500 mt-1">Acidentes graves</div>
            </div>
          </div>

          {/* Por dimensão */}
          {mensal.porDimensao?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Incidências por Dimensão de Risco</h3>
              <div className="space-y-3">
                {mensal.porDimensao.map((d: any) => (
                  <div key={d.dimensao} className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium w-24 text-center ${DIM_CORES[d.dimensao]}`}>{d.dimensao}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(100, (d.total / Math.max(1, mensal.totais.incidentes + mensal.totais.quaseIncidentes)) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-8 text-right">{d.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Por protocolo */}
          {mensal.porProtocolo?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Protocolos mais violados</h3>
              <div className="space-y-2">
                {mensal.porProtocolo.map((p: any) => (
                  <div key={p.protocolo.ranking} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center">#{p.protocolo.ranking}</span>
                    <span className="flex-1 text-sm text-gray-700 truncate">{p.protocolo.nome}</span>
                    <span className="text-sm font-bold text-gray-800">{p.total}</span>
                    {p.quaseIncidentes > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{p.quaseIncidentes} quasi</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tendência 3 meses */}
          {mensal.tendencia?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Tendência (últimos 3 meses)</h3>
              <div className="flex items-end gap-4">
                {mensal.tendencia.map((m: any) => (
                  <div key={m.mes} className="flex-1 text-center">
                    <div className="bg-indigo-100 rounded-t" style={{ height: `${Math.max(8, m.total * 20)}px` }} />
                    <div className="text-lg font-bold text-indigo-700 mt-1">{m.total}</div>
                    <div className="text-xs text-gray-500">{m.mes}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SEMANAL ── */}
      {tab === 'semanal' && semanal && !loading && (
        <div className="space-y-5">
          <div className="text-sm text-gray-500">
            <Clock className="w-4 h-4 inline mr-1" />
            Semana atual desde {semanal.periodo?.inicio ? new Date(semanal.periodo.inicio).toLocaleDateString('pt-PT') : '—'}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="text-2xl font-bold text-red-700">{semanal.incidentes?.total || 0}</div>
              <div className="text-sm text-gray-500 mt-1">Incidentes confirmados</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="text-2xl font-bold text-amber-700">{semanal.quaseIncidentes || 0}</div>
              <div className="text-sm text-gray-500 mt-1">Quase-incidentes</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-700">{semanal.checklists?.completadas || 0}</div>
              <div className="text-sm text-gray-500 mt-1">Checklists completas</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{semanal.checklists?.total || 0}</div>
              <div className="text-sm text-gray-500 mt-1">Checklists totais</div>
            </div>
          </div>

          {/* Incidentes da semana */}
          {semanal.incidentes?.lista?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Incidentes desta semana</h3>
              <div className="space-y-2">
                {semanal.incidentes.lista.map((i: any) => (
                  <div key={i.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="flex-1 text-sm text-gray-700 truncate">{i.descricao}</span>
                    {i.protocolo && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">#{i.protocolo.ranking}</span>}
                    <span className="text-xs text-gray-400">{new Date(i.data).toLocaleDateString('pt-PT')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {semanal.incidentes?.lista?.length === 0 && semanal.quaseIncidentes === 0 && (
            <div className="text-center py-10 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-medium">Semana sem incidentes</p>
            </div>
          )}
        </div>
      )}

      {/* ── REINCIDÊNCIAS ── */}
      {tab === 'reincidencias' && reincidencias && !loading && (
        <div className="space-y-5">
          <div className={`rounded-2xl p-5 border-2 ${reincidencias.semAlertas ? 'bg-green-50 border-green-400' : 'bg-orange-50 border-orange-400'}`}>
            <div className="flex items-center gap-3">
              {reincidencias.semAlertas
                ? <CheckCircle className="w-7 h-7 text-green-600" />
                : <Bell className="w-7 h-7 text-orange-600" />}
              <div>
                <div className={`font-bold ${reincidencias.semAlertas ? 'text-green-700' : 'text-orange-700'}`}>
                  {reincidencias.semAlertas ? 'Sem alertas de reincidência nos últimos 30 dias' : `${reincidencias.totalReincidencias} alerta(s) de reincidência detectado(s)`}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Critério: mesmo instrutor + mesmo protocolo ≥ 3 ocorrências em 30 dias</div>
              </div>
            </div>
          </div>

          {reincidencias.alertas?.map((a: any, idx: number) => (
            <div key={idx} className="bg-white rounded-xl border-2 border-orange-300 p-5">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{a.protocoloNome}</div>
                  <div className="text-sm text-gray-500">Instrutor: {a.instrutorEmail} · <span className="font-bold text-orange-700">{a.contagem} ocorrências</span> em {a.periodo}</div>
                </div>
                {!a.escalado && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Requer ação</span>
                )}
              </div>
              <div className="space-y-1">
                {a.incidentes?.map((i: any) => (
                  <div key={i.id} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${i.tipoOcorrencia === 'QUASE_INCIDENTE' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {i.tipoOcorrencia === 'QUASE_INCIDENTE' ? 'QUASI' : i.tipo}
                    </span>
                    <span>{new Date(i.data).toLocaleDateString('pt-PT')}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
