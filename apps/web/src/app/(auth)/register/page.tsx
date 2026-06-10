'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Waves, Sparkles, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2,
  User, Mail, Lock, Phone, GraduationCap, Dumbbell, Globe, Calendar, Users2,
} from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

type Role = 'STUDENT' | 'INSTRUCTOR' | 'VISITOR';

const ROLES: {
  id: Role;
  label: string;
  sub: string;
  icon: any;
  color: string;
  border: string;
  bg: string;
}[] = [
  {
    id: 'STUDENT',
    label: 'Atleta',
    sub: 'Quero treinar e acompanhar o meu progresso',
    icon: Dumbbell,
    color: 'text-blue-600',
    border: 'border-blue-400',
    bg: 'bg-blue-50',
  },
  {
    id: 'INSTRUCTOR',
    label: 'Treinador',
    sub: 'Quero gerir atletas e criar treinos',
    icon: GraduationCap,
    color: 'text-purple-600',
    border: 'border-purple-400',
    bg: 'bg-purple-50',
  },
  {
    id: 'VISITOR',
    label: 'Visitante',
    sub: 'Quero explorar a plataforma',
    icon: Globe,
    color: 'text-emerald-600',
    border: 'border-emerald-400',
    bg: 'bg-emerald-50',
  },
];

// ─── Step 1: Role Selection ────────────────────────────────────────────────────

function RoleSelect({ onSelect }: { onSelect: (r: Role) => void }) {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Criar conta gratuita</h1>
        <p className="text-gray-500 text-sm">Como vais usar a plataforma?</p>
      </div>
      <div className="space-y-3">
        {ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 text-left bg-white transition-all hover:border-blue-300 hover:shadow-md group"
            >
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
                <Icon className={`w-5 h-5 text-gray-400 group-hover:${r.color} transition-colors`} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-900">{r.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.sub}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm text-gray-500 mt-6">
        Já tens conta?{' '}
        <Link href="/login" className="text-blue-600 font-semibold hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}

// ─── Step 2: Details Form ──────────────────────────────────────────────────────

function RegisterForm({ role, onBack }: { role: Role; onBack: () => void }) {
  const router = useRouter();
  const googleLogin = useAuthStore((s) => s.googleLogin);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    gender: 'OTHER',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const strength = (() => {
    const p = form.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const roleInfo = ROLES.find((r) => r.id === role)!;
  const Icon = roleInfo.icon;

  const storeLogin = (user: any, accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    document.cookie = `mastchieve-role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
    useAuthStore.setState({ user, accessToken, refreshToken, isAuthenticated: true });
  };

  const redirectForRole = (r: Role) => {
    if (r === 'INSTRUCTOR') router.push('/instructor');
    else if (r === 'VISITOR') router.push('/');
    else router.push('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (role === 'VISITOR') {
        res = await api.post('/auth/register-visitor', {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
        });
      } else {
        const dto: any = {
          role,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
        };
        if (role === 'STUDENT') {
          dto.dateOfBirth = form.dateOfBirth || undefined;
          dto.gender = form.gender;
        }
        res = await api.post('/auth/register', dto);
      }
      const { user, accessToken, refreshToken } = res.data.data;
      setSuccess(true);
      setTimeout(() => {
        storeLogin(user, accessToken, refreshToken);
        redirectForRole(role);
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao criar conta. Tenta novamente.');
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
      redirectForRole((u?.role as Role) ?? 'VISITOR');
    } catch {
      setError('Erro ao autenticar com Google.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conta criada!</h2>
        <p className="text-gray-500">A redirecionar para a plataforma...</p>
      </div>
    );
  }

  return (
    <>
      {/* Back + role badge */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${roleInfo.bg} ${roleInfo.color}`}
        >
          <Icon className="w-3.5 h-3.5" />
          {roleInfo.label}
        </span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-900 mb-1">Os teus dados</h1>
        <p className="text-gray-500 text-sm">Preenche os campos abaixo para criar a conta</p>
      </div>

      {/* Google sign-up */}
      {GOOGLE_CLIENT_ID && (
        <div className="mb-5">
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => setError('Erro ao autenticar com Google.')}
              width={368}
              text="signup_with"
              shape="rectangular"
            />
          </div>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs font-medium">ou preenche o formulário</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nome</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={form.firstName}
                onChange={set('firstName')}
                required
                placeholder="João"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Apelido</label>
            <input
              value={form.lastName}
              onChange={set('lastName')}
              required
              placeholder="Silva"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              placeholder="joao@email.com"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Telemóvel <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="+351 900 000 000"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* STUDENT-only: date of birth + gender */}
        {role === 'STUDENT' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Data de nascimento</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={set('dateOfBirth')}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Género</label>
              <div className="relative">
                <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={form.gender}
                  onChange={set('gender')}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all appearance-none"
                >
                  <option value="OTHER">Outro</option>
                  <option value="MALE">Masculino</option>
                  <option value="FEMALE">Feminino</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Palavra-passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.password && (
            <div className="mt-2 flex gap-1 items-center">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    i < strength
                      ? ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'][strength - 1]
                      : 'bg-gray-200'
                  }`}
                />
              ))}
              <span className="text-[10px] text-gray-400 ml-1">
                {['', 'Fraca', 'Média', 'Boa', 'Forte'][strength]}
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl mt-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Criar conta</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        Já tens conta?{' '}
        <Link href="/login" className="text-blue-600 font-semibold hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div
        className="min-h-screen flex"
        style={{ background: 'linear-gradient(135deg, #0F1F5C 0%, #1A3A9C 50%, #1A56DB 100%)' }}
      >
        {/* Left decorative panel */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-16 text-white relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -left-8 bottom-20 w-48 h-48 rounded-full bg-white/5" />
          <div className="relative text-center max-w-md">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/30">
              <Waves className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black mb-4 leading-tight">
              Começa a tua jornada
              <br />
              de campeão
            </h2>
            <p className="text-white/70 text-base leading-relaxed mb-10">
              Junta-te a mais de 1.200 atletas que usam a IA para superar os seus limites e alcançar novos recordes.
            </p>
            {[
              'IA personalizada para cada atleta',
              'Planos de treino automáticos',
              'Progresso rastreado em tempo real',
              'Suporte de treinadores experientes',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-white/80 text-sm mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right: form panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Waves className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Mastchieve</span>
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </div>

            {selectedRole === null ? (
              <RoleSelect onSelect={setSelectedRole} />
            ) : (
              <RegisterForm role={selectedRole} onBack={() => setSelectedRole(null)} />
            )}
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
