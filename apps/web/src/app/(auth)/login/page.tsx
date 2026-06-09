'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Waves, Sparkles, Eye, EyeOff, Lock, Mail, AlertCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

const schema = z.object({
  email: z.string().email('Endereço de email inválido'),
  password: z.string().min(1, 'Introduz a palavra-passe'),
});
type FormData = z.infer<typeof schema>;

// ─── Field Error component ────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5 font-medium">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {message}
    </p>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const googleLogin = useAuthStore((s) => s.googleLogin);

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [apiErrors, setApiErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [shakingField, setShakingField] = useState<'email' | 'password' | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const emailValue = watch('email', '');
  const passwordValue = watch('password', '');

  const redirectAfterLogin = (role: string) => {
    if (role === 'INSTRUCTOR') router.push('/instructor');
    else if (role === 'VISITOR') router.push('/');
    else router.push('/dashboard');
  };

  const triggerShake = (field: 'email' | 'password') => {
    setShakingField(field);
    setTimeout(() => setShakingField(null), 600);
  };

  const clearApiError = (field: 'email' | 'password') => {
    if (apiErrors[field]) setApiErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setApiErrors({});
    try {
      await login(data.email, data.password);
      const u = useAuthStore.getState().user;
      redirectAfterLogin(u?.role ?? 'VISITOR');
    } catch (e: any) {
      const msg: string = e.response?.data?.message ?? e.message ?? '';
      if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('encontrado')) {
        setApiErrors({ email: msg });
        triggerShake('email');
      } else if (msg.toLowerCase().includes('palavra-passe') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('incorreta')) {
        setApiErrors({ password: msg });
        triggerShake('password');
      } else if (msg.toLowerCase().includes('desactivada')) {
        setApiErrors({ general: msg });
      } else {
        setApiErrors({ general: 'Ocorreu um erro. Verifica as credenciais e tenta novamente.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse: any) => {
    setApiErrors({});
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      const u = useAuthStore.getState().user;
      redirectAfterLogin(u?.role ?? 'VISITOR');
    } catch {
      setApiErrors({ general: 'Erro ao autenticar com Google. Tenta novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const emailHasError = !!(errors.email || apiErrors.email);
  const passwordHasError = !!(errors.password || apiErrors.password);

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
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => setApiErrors({ general: 'Erro ao autenticar com Google.' })}
              width={368}
              text="signin_with"
              shape="rectangular"
              useOneTap={false}
            />
          </div>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs font-medium">ou entra com email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>
      )}

      {/* General error banner */}
      {apiErrors.general && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{apiErrors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Email
          </label>
          <div
            className="relative"
            style={shakingField === 'email' ? { animation: 'input-shake 0.5s ease' } : {}}
          >
            <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${emailHasError ? 'text-red-400' : 'text-gray-400'}`} />
            <input
              {...register('email')}
              type="email"
              placeholder="nome@exemplo.com"
              onChange={(e) => { register('email').onChange(e); clearApiError('email'); }}
              className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50 focus:bg-white transition-all ${
                emailHasError
                  ? 'border-red-400 focus:ring-red-300 bg-red-50'
                  : 'border-gray-200 focus:ring-blue-500 focus:border-transparent'
              }`}
            />
          </div>
          <FieldError message={apiErrors.email || errors.email?.message} />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Palavra-passe
          </label>
          <div
            className="relative"
            style={shakingField === 'password' ? { animation: 'input-shake 0.5s ease' } : {}}
          >
            <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${passwordHasError ? 'text-red-400' : 'text-gray-400'}`} />
            <input
              {...register('password')}
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              onChange={(e) => { register('password').onChange(e); clearApiError('password'); }}
              className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50 focus:bg-white transition-all ${
                passwordHasError
                  ? 'border-red-400 focus:ring-red-300 bg-red-50'
                  : 'border-gray-200 focus:ring-blue-500 focus:border-transparent'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <FieldError message={apiErrors.password || errors.password?.message} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl mt-2"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>A verificar...</span>
            </div>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

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
