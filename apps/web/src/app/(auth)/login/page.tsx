'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Waves, Sparkles, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});
type FormData = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const user = useAuthStore((s) => s.user);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const redirectAfterLogin = (role: string) => {
    if (role === 'VISITOR') router.push('/');
    else router.push('/dashboard');
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await login(data.email, data.password);
      const u = useAuthStore.getState().user;
      redirectAfterLogin(u?.role ?? 'VISITOR');
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Credenciais inválidas. Verifica e tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      const u = useAuthStore.getState().user;
      redirectAfterLogin(u?.role ?? 'VISITOR');
    } catch {
      setError('Erro ao autenticar com Google. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
      {/* Logo (mobile) */}
      <div className="flex items-center gap-2.5 mb-8 lg:hidden">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
          <Waves className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-gray-900 text-lg leading-none">Mastchieve</div>
          <div className="flex items-center gap-1 mt-0.5">
            <Sparkles className="w-3 h-3 text-yellow-500" />
            <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">IA Platform</span>
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-black text-gray-900 mb-1">Bem-vindo de volta</h1>
      <p className="text-gray-500 text-sm mb-6">Inicia sessão para continuar</p>

      {/* Google login */}
      {GOOGLE_CLIENT_ID && (
        <div className="mb-5">
          <GoogleLogin
            onSuccess={handleGoogle}
            onError={() => setError('Erro ao autenticar com Google.')}
            width="100%"
            text="signin_with"
            shape="rectangular"
          />
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs font-medium">ou entra com email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('email')}
              type="email"
              placeholder="admin@mastchieve.com"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Palavra-passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('password')}
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : 'Entrar'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Não tens conta?{' '}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">Criar conta grátis</Link>
        </p>
      </div>

      <div className="mt-6 pt-5 border-t border-gray-100 text-center">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Voltar à página inicial
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0F1F5C 0%, #1A3A9C 50%, #1A56DB 100%)' }}>
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-16 text-white relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -left-8 bottom-20 w-48 h-48 rounded-full bg-white/5" />
          <div className="relative text-center">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/30 shadow-xl">
              <Waves className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-black mb-3 tracking-tight">Mastchieve</h2>
            <div className="flex items-center justify-center gap-1 mb-8">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-white/70 text-sm font-medium uppercase tracking-widest">IA Platform</span>
            </div>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              A plataforma de gestão de atletas de natação com inteligência artificial. Transforma dados em campeões.
            </p>
            <div className="mt-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-left max-w-sm">
              <p className="text-white/80 text-sm italic leading-relaxed">&ldquo;Em 3 meses passei de bronze a ouro. A IA da Mastchieve mudou a minha natação.&rdquo;</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold">A</div>
                <div>
                  <p className="text-white text-xs font-semibold">Ana Rodrigues</p>
                  <p className="text-white/50 text-[10px]">Atleta — 14 anos</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <LoginForm />
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
