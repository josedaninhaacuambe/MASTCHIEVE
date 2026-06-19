'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { Waves, Sparkles, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

type Step = 'email' | 'sent' | 'reset' | 'done';

export default function ForgotPasswordPage() {
  const [step, setStep]   = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [devToken, setDevToken] = useState<string | null>(null);

  const forgotMutation = useMutation({
    mutationFn: () => api.post('/users/forgot-password', { email }),
    onSuccess: (res: any) => {
      if (res.data?.devToken) setDevToken(res.data.devToken);
      setStep('sent');
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => api.post('/users/reset-password', { token, newPassword: newPass }),
    onSuccess: () => setStep('done'),
  });

  const mismatch = confirm.length > 0 && newPass !== confirm;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0f2050] to-[#1a3a8f] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/30">
              <Waves className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="text-white font-bold text-xl leading-none">Mastchieve</div>
              <div className="flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span className="text-white/50 text-xs">IA Platform</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 p-8">

          {/* Step: Email */}
          {step === 'email' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Recuperar acesso</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Introduza o seu email e enviaremos as instruções para redefinir a palavra-passe.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && email && forgotMutation.mutate()}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      placeholder="o.seu@email.com"
                    />
                  </div>
                </div>
                <button
                  onClick={() => forgotMutation.mutate()}
                  disabled={!email || forgotMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {forgotMutation.isPending ? 'A enviar...' : 'Enviar instruções'}
                </button>
                {forgotMutation.isError && (
                  <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Erro ao processar. Tente novamente.
                  </div>
                )}
              </div>
            </>
          )}

          {/* Step: Sent */}
          {step === 'sent' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email enviado!</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Se o email <strong>{email}</strong> estiver registado, receberá as instruções em breve.
                Verifique também a caixa de spam.
              </p>
              {devToken && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-left">
                  <p className="text-xs text-yellow-700 font-medium mb-1">Modo desenvolvimento — token de reset:</p>
                  <code className="text-xs text-yellow-800 break-all">{devToken}</code>
                  <button onClick={() => { setToken(devToken); setStep('reset'); }}
                    className="mt-2 text-xs text-yellow-700 underline">
                    Usar este token agora
                  </button>
                </div>
              )}
              <button onClick={() => setStep('reset')}
                className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                Já tenho o token de reset
              </button>
            </div>
          )}

          {/* Step: Reset */}
          {step === 'reset' && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Nova palavra-passe</h1>
                <p className="text-gray-500 text-sm mt-1">Introduza o token recebido e defina a sua nova palavra-passe.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Token de reset</label>
                  <input value={token} onChange={e => setToken(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="Token recebido por email" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Nova palavra-passe</label>
                  <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo 6 caracteres" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Confirmar</label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${mismatch ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'}`}
                    placeholder="Repetir nova palavra-passe" />
                  {mismatch && <p className="text-xs text-red-500 mt-1">As palavras-passe não coincidem</p>}
                </div>
                <button
                  onClick={() => resetMutation.mutate()}
                  disabled={!token || newPass.length < 6 || mismatch || resetMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                  {resetMutation.isPending ? 'A redefinir...' : 'Redefinir palavra-passe'}
                </button>
                {resetMutation.isError && (
                  <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Token inválido ou expirado.
                  </div>
                )}
              </div>
            </>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Palavra-passe redefinida!</h2>
              <p className="text-gray-500 text-sm mb-6">
                A sua palavra-passe foi alterada com sucesso. Pode fazer login com a nova palavra-passe.
              </p>
              <Link href="/login"
                className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold transition">
                Ir para o login
              </Link>
            </div>
          )}

          {/* Back link */}
          {step !== 'done' && (
            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
                <ArrowLeft className="w-4 h-4" /> Voltar ao login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
