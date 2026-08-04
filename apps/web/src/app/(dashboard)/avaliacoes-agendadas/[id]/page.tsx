'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import AvaliacaoModal from '@/components/avaliacoes/AvaliacaoModal';
import { ArrowLeft, User, CheckCircle2, XCircle, Calendar } from 'lucide-react';

const ESTADO_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  AGENDADA:     { label: 'Agendada',     bg: 'bg-blue-50',   text: 'text-blue-700' },
  EM_ANDAMENTO: { label: 'Em Andamento', bg: 'bg-amber-50',  text: 'text-amber-700' },
  CONCLUIDA:    { label: 'Concluída',    bg: 'bg-green-50',  text: 'text-green-700' },
  CANCELADA:    { label: 'Cancelada',    bg: 'bg-red-50',    text: 'text-red-700' },
};

export default function AvaliacaoAgendadaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [sessao, setSessao] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [avaliando, setAvaliando] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    const r = await api.get(`/avaliacoes-agendadas/${id}/roster`);
    const payload = r.data.data ?? r.data;
    setSessao(payload.sessao);
    setRoster(payload.roster);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="p-6 text-center text-gray-400">A carregar...</div>;
  if (!sessao) return <div className="p-6 text-center text-gray-400">Sessão não encontrada</div>;

  const cfg = ESTADO_CONFIG[sessao.estado] ?? { label: sessao.estado, bg: 'bg-gray-50', text: 'text-gray-700' };

  return (
    <div className="p-6 space-y-6">
      <button onClick={() => router.push('/avaliacoes-agendadas')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3 flex-wrap mb-1">
          <h1 className="text-xl font-bold text-gray-900">{sessao.class?.name ?? '—'}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          {sessao.data ? new Date(sessao.data).toLocaleDateString('pt-PT') : '—'}
        </div>
        {sessao.observacoes && <p className="text-sm text-gray-400 mt-2 italic">{sessao.observacoes}</p>}
      </div>

      <div className="space-y-3">
        {roster.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-gray-400">Nenhum atleta ativo nesta turma</p>
          </div>
        )}
        {roster.map((r: any) => (
          <div key={r.student.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{r.student.firstName} {r.student.lastName}</p>
              <p className="text-xs text-gray-400">
                {r.moduloAtivo ? `${r.moduloAtivo.nome} — Fase ${r.moduloAtivo.ordem} (${r.moduloAtivo.nivel})` : 'Sem módulo ativo'}
              </p>
            </div>

            {r.resultado ? (
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                r.resultado.aprovado ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {r.resultado.aprovado ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {r.resultado.aprovado ? 'Aprovado' : 'Reprovado'}
              </span>
            ) : r.moduloAtivo ? (
              <button onClick={() => setAvaliando(r)}
                className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium">
                Avaliar
              </button>
            ) : (
              <span className="text-xs text-gray-400">Não avaliável</span>
            )}
          </div>
        ))}
      </div>

      {avaliando && (
        <AvaliacaoModal
          tipo="AGENDADA"
          sessaoAgendadaId={id}
          studentId={avaliando.student.id}
          studentName={`${avaliando.student.firstName} ${avaliando.student.lastName}`}
          moduloAtivo={avaliando.moduloAtivo}
          onClose={() => setAvaliando(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
