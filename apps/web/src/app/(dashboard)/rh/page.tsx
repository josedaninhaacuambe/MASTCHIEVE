'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Users, Briefcase, FileSignature, Banknote, CalendarX, Gavel, LogOut, GraduationCap, IdCard,
} from 'lucide-react';

export default function RhDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/rh/relatorios/dashboard')
      .then((r) => setData(r.data.data || r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">A carregar...</div>;
  if (!data) return <div className="text-center py-12 text-gray-400">Sem dados</div>;

  const aprov = data.aprovacoesPendentesSuperAdmin || {};
  const totalPendentes = Object.values(aprov).reduce<number>((s, v: any) => s + (v || 0), 0);

  const aprovCards = [
    { label: 'Vagas', value: aprov.vagas, href: '/rh/vagas', icon: Briefcase },
    { label: 'Contratos', value: aprov.contratos, href: '/rh/contratos', icon: FileSignature },
    { label: 'Folha Pagamento', value: aprov.folhaPagamento, href: '/rh/folha-pagamento', icon: Banknote },
    { label: 'Férias/Faltas', value: aprov.feriasFaltas, href: '/rh/ferias-faltas', icon: CalendarX },
    { label: 'Disciplina', value: aprov.ocorrenciasDisciplinares, href: '/rh/disciplina', icon: Gavel },
    { label: 'Desligamentos', value: aprov.desligamentos, href: '/rh/desligamento', icon: LogOut },
    { label: 'Formações', value: aprov.formacoes, href: '/rh/formacao', icon: GraduationCap },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recursos Humanos</h1>
        <p className="text-gray-500 text-sm mt-1">Painel de gestão de RH — recrutamento, admissão, gestão contínua, disciplina e desligamento</p>
      </div>

      {/* Stats principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-blue-600" /><span className="text-xs font-medium text-gray-600">Funcionários</span></div>
          <div className="text-2xl font-bold text-gray-800">{data.totalFuncionarios}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1"><Briefcase className="w-4 h-4 text-indigo-600" /><span className="text-xs font-medium text-gray-600">Candidaturas em curso</span></div>
          <div className="text-2xl font-bold text-gray-800">{data.candidaturasEmAndamento}</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-1"><IdCard className="w-4 h-4 text-amber-600" /><span className="text-xs font-medium text-gray-600">Certificações a expirar (30d)</span></div>
          <div className="text-2xl font-bold text-amber-700">{data.certificacoesAExpirar}</div>
        </div>
        <div className={`rounded-xl p-4 border ${totalPendentes > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2 mb-1"><Gavel className={`w-4 h-4 ${totalPendentes > 0 ? 'text-red-600' : 'text-green-600'}`} /><span className="text-xs font-medium text-gray-600">Aprovações pendentes</span></div>
          <div className={`text-2xl font-bold ${totalPendentes > 0 ? 'text-red-700' : 'text-green-700'}`}>{totalPendentes}</div>
        </div>
      </div>

      {/* Aprovações pendentes (Super Admin) */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Aprovações pendentes (Super Admin)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {aprovCards.map(({ label, value, href, icon: Icon }) => (
            <Link key={label} href={href} className={`rounded-xl p-4 border transition hover:shadow-md ${value > 0 ? 'bg-white border-amber-300' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4 text-gray-500" /><span className="text-xs font-medium text-gray-600">{label}</span></div>
              <div className={`text-xl font-bold ${value > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{value || 0}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Distribuição por estado / cargo */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Funcionários por estado</h3>
          <div className="space-y-2">
            {(data.porEstado || []).map((e: any) => (
              <div key={e.estado} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{e.estado.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-gray-800">{e.total}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Funcionários por cargo</h3>
          <div className="space-y-2">
            {(data.porCargo || []).map((c: any) => (
              <div key={c.cargo} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{c.cargo.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-gray-800">{c.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
