'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { Baby, Copy, Link2, MessageCircle, Plus, QrCode, X } from 'lucide-react';

interface Props {
  student: any;
  /** Abre o QR de acesso já existente na ficha do atleta. */
  onAbrirQr: () => void;
}

interface Convite {
  link: string;
  expiraEm: string;
  email: string;
  emailGerado: boolean;
  telefone: string | null;
  nome: string;
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500';

function idade(data?: string) {
  if (!data) return null;
  const n = new Date(data);
  if (isNaN(n.getTime())) return null;
  const h = new Date();
  let a = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) a--;
  return a;
}

function erroApi(e: any, fallback: string) {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join(', ') : m || fallback;
}

/** Número em formato internacional para wa.me (Moçambique por omissão). Não inventa números. */
function numeroWhatsApp(tel: string | null) {
  if (!tel) return null;
  const d = tel.replace(/\D/g, '');
  if (d.length < 9) return null;
  return d.length === 9 ? `258${d}` : d;
}

export default function FilhosEAcesso({ student, onAbrirQr }: Props) {
  const qc = useQueryClient();
  const adulto = (idade(student.dateOfBirth) ?? 0) >= 18;
  const temConta = !!student.userId;
  const [form, setForm] = useState<any>(null);
  const [convite, setConvite] = useState<Convite | null>(null);

  const { data: filhos = [], isLoading } = useQuery({
    queryKey: ['filhos', student.id],
    queryFn: async () => { const { data } = await api.get(`/students/${student.id}/filhos`); return data.data ?? []; },
    enabled: adulto,
  });

  const { data: turmas = [] } = useQuery({
    queryKey: ['turmas-unidade', student.unidadeId],
    queryFn: async () => {
      const { data } = await api.get(`/classes?limit=100&status=ACTIVE&unidadeId=${student.unidadeId}`);
      return data.data?.data ?? data.data ?? [];
    },
    enabled: !!form && !!student.unidadeId,
  });

  const adicionar = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
      };
      if (form.classId) payload.classId = form.classId;
      if (form.relationship) payload.relationship = form.relationship;
      if (form.medicalNotes?.trim()) payload.medicalNotes = form.medicalNotes.trim();
      const { data } = await api.post(`/students/${student.id}/filhos`, payload);
      return data.data;
    },
    onSuccess: (r) => {
      if (r?.avisoTurma) toast.warning(`Filho inscrito, mas sem turma: ${r.avisoTurma}`);
      else toast.success('Filho inscrito e associado ao encarregado.');
      setForm(null);
      qc.invalidateQueries({ queryKey: ['filhos', student.id] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (e) => toast.error(erroApi(e, 'Não foi possível inscrever o filho.')),
  });

  const gerarConvite = useMutation({
    mutationFn: async () => { const { data } = await api.post(`/students/${student.id}/convite-acesso`); return data.data as Convite; },
    onSuccess: (c) => setConvite(c),
    onError: (e) => toast.error(erroApi(e, 'Não foi possível gerar o link de acesso.')),
  });

  const mensagem = convite
    ? `Olá ${convite.nome}. Para entrar no sistema da Mastchieve, abra este link e defina a sua password (válido até ${new Date(convite.expiraEm).toLocaleString('pt-PT')}, uso único):\n${convite.link}\nO seu email de acesso é: ${convite.email}`
    : '';
  const wa = convite ? numeroWhatsApp(convite.telefone) : null;

  const copiar = async () => {
    try { await navigator.clipboard.writeText(mensagem); toast.success('Mensagem copiada.'); }
    catch { toast.error('Não foi possível copiar — seleccione o texto manualmente.'); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
      {/* ── Partilhar acesso ── */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><Link2 className="w-4 h-4" /> Acesso ao sistema</h3>
          {temConta && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => gerarConvite.mutate()} disabled={gerarConvite.isPending}
                className="flex items-center gap-1.5 bg-mastchieve-600 hover:bg-mastchieve-700 disabled:opacity-60 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
                <Link2 className="w-4 h-4" /> {gerarConvite.isPending ? 'A gerar…' : 'Gerar link de acesso'}
              </button>
              <button onClick={onAbrirQr}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition">
                <QrCode className="w-4 h-4" /> QR de acesso
              </button>
            </div>
          )}
        </div>
        {!temConta && <p className="text-xs text-gray-500 mt-2">Este atleta não tem conta de acesso própria.</p>}
        {convite && (
          <div className="mt-3 rounded-xl border border-mastchieve-100 bg-mastchieve-50/50 p-4 space-y-3">
            <p className="text-xs text-gray-600">
              Link de uso único, válido até <strong>{new Date(convite.expiraEm).toLocaleString('pt-PT')}</strong>. Gerar outro invalida este.
              {convite.emailGerado && ' O email de acesso foi gerado pelo sistema — indique-o ao encarregado.'}
            </p>
            <textarea readOnly value={mensagem} rows={4} className={`${inputCls} bg-white font-mono text-xs`} onFocus={(e) => e.target.select()} />
            <div className="flex flex-wrap gap-2">
              <button onClick={copiar} className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition">
                <Copy className="w-4 h-4" /> Copiar
              </button>
              {wa ? (
                <a href={`https://wa.me/${wa}?text=${encodeURIComponent(mensagem)}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
                  <MessageCircle className="w-4 h-4" /> Abrir no WhatsApp
                </a>
              ) : (
                <span className="text-xs text-amber-700 self-center">Sem telefone registado — copie o link e entregue-o por outro meio.</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Filhos (só atletas adultos) ── */}
      {adulto && (
        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><Baby className="w-4 h-4" /> Filhos inscritos na escola</h3>
            {temConta && !form && (
              <button onClick={() => setForm({ firstName: '', lastName: student.lastName ?? '', dateOfBirth: '', gender: 'MALE', classId: '', relationship: '', medicalNotes: '' })}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-medium transition">
                <Plus className="w-4 h-4" /> Adicionar filho
              </button>
            )}
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-400">A carregar…</p>
          ) : filhos.length === 0 ? (
            <p className="text-sm text-gray-400">Sem filhos associados.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filhos.map((f: any) => (
                <li key={f.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/students/${f.id}`} className="text-sm font-medium text-gray-900 hover:text-mastchieve-700">
                    {f.firstName} {f.lastName} <span className="text-gray-400 font-normal">· {idade(f.dateOfBirth)} anos</span>
                  </Link>
                  <span className="text-xs text-gray-500">
                    {f.enrollments?.length ? f.enrollments.map((e: any) => e.class.name).join(', ') : 'Sem turma'}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {form && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth) { toast.error('Preencha nome, apelido e data de nascimento.'); return; }
                adicionar.mutate();
              }}
              className="mt-4 rounded-xl border border-gray-200 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Novo filho</h4>
                <button type="button" onClick={() => setForm(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="Nome *" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputCls} maxLength={60} />
                <input placeholder="Apelido *" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputCls} maxLength={60} />
                <label className="text-xs text-gray-500">Data de nascimento *
                  <input type="date" value={form.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className={`${inputCls} mt-1`} />
                </label>
                <label className="text-xs text-gray-500">Género
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={`${inputCls} mt-1`}>
                    <option value="MALE">Masculino</option>
                    <option value="FEMALE">Feminino</option>
                  </select>
                </label>
                <label className="text-xs text-gray-500">Relação
                  <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className={`${inputCls} mt-1`}>
                    <option value="">Pai / Mãe</option>
                    <option value="Pai">Pai</option>
                    <option value="Mãe">Mãe</option>
                    <option value="Tutor">Tutor</option>
                  </select>
                </label>
                <label className="text-xs text-gray-500">Turma
                  <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className={`${inputCls} mt-1`} disabled={!student.unidadeId}>
                    <option value="">{student.unidadeId ? '— Sem turma —' : 'Defina primeiro a unidade do encarregado'}</option>
                    {turmas.map((t: any) => {
                      const cheia = (t.enrolledCount ?? 0) >= t.maxStudents;
                      return <option key={t.id} value={t.id} disabled={cheia}>{t.name} ({t.enrolledCount ?? 0}/{t.maxStudents}){cheia ? ' — lotada' : ''}</option>;
                    })}
                  </select>
                </label>
              </div>
              <textarea placeholder="Notas médicas (opcional)" value={form.medicalNotes} onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })} rows={2} className={inputCls} maxLength={1000} />
              <p className="text-xs text-gray-500">O filho fica na mesma unidade{student.etiqueta === 'BM' ? ' e com a etiqueta BM' : ''} do encarregado.</p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setForm(null)} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" disabled={adicionar.isPending} className="bg-mastchieve-600 hover:bg-mastchieve-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  {adicionar.isPending ? 'A inscrever…' : 'Inscrever filho'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
