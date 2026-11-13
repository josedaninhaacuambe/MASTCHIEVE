'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { LogIn, LogOut, Users } from 'lucide-react';

/** Igual a DURACAO_AULA_MIN na API (sessao-aula.util.ts). */
export const DURACAO_AULA_MIN = 50;

interface BulkEntradaSaidaModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export function BulkEntradaSaidaModal({ onClose, onSaved }: BulkEntradaSaidaModalProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tipo, setTipo] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [justificativa, setJustificativa] = useState('');
  const [hora, setHora] = useState('');
  const [horaManual, setHoraManual] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/classes?limit=100&status=ACTIVE').then((r) => setClasses(r.data.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!classId) { setStudents([]); setSelected(new Set()); return; }
    setLoadingStudents(true);
    api.get(`/classes/${classId}`)
      .then((r) => {
        const enrolled = (r.data.data?.enrollments ?? []).map((e: any) => e.student).filter(Boolean);
        setStudents(enrolled);
        setSelected(new Set());
      })
      .catch(() => { setStudents([]); toast.error('Erro ao carregar atletas da turma'); })
      .finally(() => setLoadingStudents(false));
  }, [classId]);

  const toggleStudent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === students.length ? new Set() : new Set(students.map((s) => s.id))));
  };

  const valido = selected.size > 0 && (!horaManual || !!hora);

  const salvar = async () => {
    setSaving(true);
    try {
      const r = await api.post('/entrada-saida/registos/bulk', {
        studentIds: Array.from(selected),
        tipo,
        justificativa: tipo === 'SAIDA' ? justificativa.trim() || undefined : undefined,
        dataHora: horaManual && hora ? new Date(hora).toISOString() : undefined,
      });
      const count = r.data.data?.count ?? 0;
      const ignorados: { nome: string; motivo: string }[] = r.data.data?.ignorados ?? [];
      if (count > 0) {
        toast.success(
          tipo === 'ENTRADA' ? `${count} entrada(s) registada(s)` : `${count} saída(s) registada(s)`,
          tipo === 'ENTRADA' ? `Saída automática ao fim de ${DURACAO_AULA_MIN} min` : undefined,
        );
      }
      if (ignorados.length > 0) {
        const lista = ignorados.slice(0, 5).map((i) => `${i.nome}: ${i.motivo}`).join(' · ');
        toast.warning(`${ignorados.length} atleta(s) não registado(s)`, ignorados.length > 5 ? `${lista} · …` : lista);
      }
      if (count > 0) onSaved();
    } catch (e: any) {
      toast.error('Erro ao registar em grupo', e?.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Registo em Grupo (por Turma)</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Turma*</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">— Selecionar —</option>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex gap-2">
          {(['ENTRADA', 'SAIDA'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium border flex items-center justify-center gap-1.5',
                tipo === t ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200',
              )}
            >
              {t === 'ENTRADA' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
              {t === 'ENTRADA' ? 'Entrada' : 'Saída'}
            </button>
          ))}
        </div>

        <p className={cn('text-xs rounded-lg px-3 py-2 border',
          tipo === 'ENTRADA' ? 'text-gray-600 bg-gray-50 border-gray-100' : 'text-amber-700 bg-amber-50 border-amber-100')}>
          {tipo === 'ENTRADA'
            ? `A saída de cada atleta fica registada automaticamente ${DURACAO_AULA_MIN} min depois da entrada.`
            : 'Só para casos especiais (aula prolongada ou encurtada). Substitui a saída automática; atletas sem entrada registada são ignorados.'}
        </p>

        <div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={horaManual} onChange={(e) => { setHoraManual(e.target.checked); if (!e.target.checked) setHora(''); }} className="rounded border-gray-300" />
            Indicar a hora manualmente
          </label>
          {horaManual ? (
            <>
              <input type="datetime-local" value={hora} onChange={(e) => setHora(e.target.value)} className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <p className="text-xs text-gray-400 mt-1">Para registos anotados sem internet e lançados mais tarde (até 7 dias).</p>
            </>
          ) : (
            <p className="text-xs text-gray-400 mt-1">Por defeito usa a hora actual.</p>
          )}
        </div>

        {tipo === 'SAIDA' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observação para todo o grupo <span className="text-gray-400 font-normal">(opcional)</span></label>
            <textarea value={justificativa} onChange={(e) => setJustificativa(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Ex: Fim de aula — recolhidos pelos encarregados no portão" />
            <p className="text-xs text-gray-400 mt-1">Para confirmar uma pessoa autorizada específica por atleta, usa o registo individual.</p>
          </div>
        )}

        {classId && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Atletas da turma</label>
              {students.length > 0 && (
                <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
                  {selected.size === students.length ? 'Limpar seleção' : 'Selecionar todos'}
                </button>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-gray-100">
              {loadingStudents ? (
                <div className="text-center py-6 text-gray-400 text-sm">A carregar...</div>
              ) : students.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">Sem atletas matriculados nesta turma</div>
              ) : (
                students.map((s: any) => (
                  <label key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleStudent(s.id)} className="rounded border-gray-300" />
                    {s.firstName} {s.lastName}
                  </label>
                ))
              )}
            </div>
            {selected.size > 0 && <p className="text-xs text-gray-500 mt-1">{selected.size} atleta(s) selecionado(s)</p>}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={!valido || saving} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
            {saving ? 'A registar...' : 'Registar Grupo'}
          </button>
        </div>
      </div>
    </div>
  );
}
