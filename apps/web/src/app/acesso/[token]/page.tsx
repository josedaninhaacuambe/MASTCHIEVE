'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

import { Logo } from '@/components/brand/Logo';
type Convite = { nome: string | null; email: string; emailGerado: boolean; expiraEm: string };

export default function AcessoPage() {
  const { token } = useParams<{ token: string }>();
  const [convite, setConvite] = useState<Convite | null>(null);
  const [erro, setErro] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [ver, setVer] = useState(false);
  const [aGravar, setAGravar] = useState(false);
  const [feito, setFeito] = useState(false);

  useEffect(() => {
    api.get(`/auth/convite/${token}`)
      .then(({ data }) => setConvite(data?.data ?? data))
      .catch((e) => setErro(e?.response?.data?.message ?? 'Este link de acesso não é válido.'));
  }, [token]);

  const forte = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
  const podeGravar = forte && password === confirmar && !aGravar;

  const gravar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeGravar) return;
    setAGravar(true);
    setErro('');
    try {
      await api.post(`/auth/convite/${token}`, { password });
      setFeito(true);
    } catch (e: any) {
      const m = e?.response?.data?.message;
      setErro(Array.isArray(m) ? m.join(' ') : m ?? 'Não foi possível definir a password.');
    } finally {
      setAGravar(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo className="h-10" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {feito ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <h1 className="text-lg font-bold text-gray-900">Password definida</h1>
              <p className="text-sm text-gray-600">Já pode entrar com o email <strong>{convite?.email}</strong> e a password que escolheu.</p>
              <Link href="/login" className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                Entrar
              </Link>
            </div>
          ) : !convite ? (
            erro ? (
              <div className="text-center space-y-3">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                <h1 className="text-lg font-bold text-gray-900">Link indisponível</h1>
                <p className="text-sm text-gray-600">{erro}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">A validar o link…</p>
            )
          ) : (
            <form onSubmit={gravar} className="space-y-4">
              <div>
                <h1 className="text-lg font-bold text-gray-900">{convite.nome ? `Olá, ${convite.nome}` : 'Bem-vindo(a)'}</h1>
                <p className="text-sm text-gray-500 mt-1">Escolha a sua password para entrar no sistema.</p>
              </div>

              <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-blue-700">Email de acesso</p>
                  <p className="text-sm font-semibold text-blue-900 break-all">{convite.email}</p>
                  {convite.emailGerado && (
                    <p className="text-xs text-blue-700 mt-1">Guarde este email: é o seu nome de utilizador.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nova password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={ver ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => setVer((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label={ver ? 'Esconder' : 'Mostrar'}>
                    {ver ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className={`text-xs mt-1 ${forte || !password ? 'text-gray-400' : 'text-amber-600'}`}>Mínimo 8 caracteres, com letras e números.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirmar password</label>
                <input
                  type={ver ? 'text' : 'password'}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {confirmar && confirmar !== password && <p className="text-xs mt-1 text-amber-600">As passwords não coincidem.</p>}
              </div>

              {erro && <p className="text-sm text-red-600">{erro}</p>}

              <button type="submit" disabled={!podeGravar} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {aGravar ? 'A gravar…' : 'Definir password'}
              </button>
              <p className="text-xs text-gray-400 text-center">O link só pode ser usado uma vez e expira a {new Date(convite.expiraEm).toLocaleString('pt-PT')}.</p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
