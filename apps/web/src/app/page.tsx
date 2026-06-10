'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Waves, Sparkles, Trophy, Users, Brain, Star, ChevronRight,
  CheckCircle2, ArrowRight, Play, Shield, Zap, TrendingUp,
  Award, Clock, Target, BarChart3, Heart, Globe,
} from 'lucide-react';

/* ── Animated counter ── */
function Counter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const steps = 60;
        const inc = end / steps;
        let cur = 0;
        const timer = setInterval(() => {
          cur += inc;
          if (cur >= end) { setCount(end); clearInterval(timer); }
          else setCount(Math.floor(cur));
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);

  return <div ref={ref}>{count}{suffix}</div>;
}

/* ── Floating particles ── */
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/10 animate-float-particle"
          style={{
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${Math.random() * 8 + 6}s`,
          }}
        />
      ))}
    </div>
  );
}

const testimonials = [
  { name: 'Ana Rodrigues', role: 'Atleta — 14 anos', text: 'Em 3 meses passei de bronze a ouro no módulo de costas. A IA acompanhou cada detalhe da minha evolução!', avatar: 'A', stars: 5 },
  { name: 'Carlos Mendes', role: 'Instrutor Principal', text: 'Nunca tive uma ferramenta tão poderosa. O feedback automático poupa-me 2 horas por dia e os atletas evoluem muito mais rápido.', avatar: 'C', stars: 5 },
  { name: 'Sofia Ferreira', role: 'Pai de atleta', text: 'Consigo acompanhar em tempo real o progresso do meu filho. Os relatórios são claros e motivadores. Excelente!', avatar: 'S', stars: 5 },
  { name: 'Rui Santos', role: 'Atleta — 17 anos', text: 'Os vídeos recomendados e os exercícios personalizados fizeram toda a diferença para a minha técnica de mariposa.', avatar: 'R', stars: 5 },
];

const features = [
  { icon: Brain, title: 'IA Adaptativa', desc: 'Análise em tempo real do desempenho de cada atleta com recomendações personalizadas e planos de treino gerados automaticamente.', color: 'from-violet-500 to-purple-600' },
  { icon: TrendingUp, title: 'Progresso Visual', desc: 'Dashboard interativo com gráficos de evolução, conquistas desbloqueáveis e métricas por módulo de natação.', color: 'from-blue-500 to-cyan-600' },
  { icon: BarChart3, title: 'Analytics Avançado', desc: 'KPIs em tempo real para treinadores e administradores. Decisões baseadas em dados, não em intuição.', color: 'from-emerald-500 to-teal-600' },
  { icon: Award, title: 'Gamificação', desc: 'Sistema de conquistas, níveis e badges que mantém os atletas motivados e comprometidos com a evolução.', color: 'from-orange-500 to-amber-600' },
  { icon: Shield, title: 'Gestão Financeira', desc: 'Controlo total de mensalidades, histórico de pagamentos, alertas automáticos e relatórios financeiros completos.', color: 'from-rose-500 to-pink-600' },
  { icon: Target, title: 'Planos de Treino', desc: 'Planos gerados por IA com base no nível e objetivos de cada atleta, com vídeos de YouTube integrados.', color: 'from-indigo-500 to-blue-600' },
];

const plans = [
  {
    name: 'Starter',
    price: '49',
    period: '/mês',
    desc: 'Perfeito para clubes pequenos',
    features: ['Até 30 atletas', 'Dashboard básico', 'Feedback manual', 'Gestão de pagamentos', 'Suporte por email'],
    cta: 'Começar grátis',
    popular: false,
  },
  {
    name: 'Pro',
    price: '99',
    period: '/mês',
    desc: 'O favorito dos campeões',
    features: ['Atletas ilimitados', 'IA completa', 'Planos automáticos', 'Analytics avançado', 'App mobile', 'Suporte prioritário'],
    cta: 'Experimentar 14 dias',
    popular: true,
  },
  {
    name: 'Elite',
    price: '199',
    period: '/mês',
    desc: 'Para federações e academias',
    features: ['Multi-sede', 'API personalizada', 'Relatórios PDF', 'Integração federações', 'Gestor dedicado', 'SLA garantido'],
    cta: 'Falar com vendas',
    popular: false,
  },
];

const stats = [
  { value: 1200, suffix: '+', label: 'Atletas activos' },
  { value: 98, suffix: '%', label: 'Satisfação garantida' },
  { value: 340, suffix: '+', label: 'Clubes parceiros' },
  { value: 3, suffix: 'x', label: 'Mais evolução' },
];

export default function LandingPage() {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">Mastchieve</span>
            <span className="hidden sm:flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-200">
              <Sparkles className="w-3 h-3" /> IA
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Funcionalidades</a>
            <a href="#stats" className="hover:text-blue-600 transition-colors">Resultados</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">Testemunhos</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Preços</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-1.5">
              Entrar
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-blue-500/25 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F1F5C 0%, #1A3A9C 40%, #1A56DB 70%, #0891B2 100%)' }}>
        <Particles />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm mb-8">
              <div className="flex -space-x-1">
                {['A','C','S','R'].map((l, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white/20">{l}</div>
                ))}
              </div>
              <span className="text-yellow-300 font-semibold">1.200+</span> atletas já usam a plataforma
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
              A plataforma de<br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">natação inteligente</span>
              </span><br />
              que transforma atletas
            </h1>

            <p className="text-lg text-white/75 leading-relaxed mb-8 max-w-xl">
              IA que analisa, personaliza e acelera a evolução de cada nadador. Feedback automático, planos de treino inteligentes e dashboards em tempo real — tudo numa única plataforma.
            </p>

            <div className="flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 rounded-xl px-4 py-2.5 mb-8 w-fit">
              <Clock className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span className="text-amber-200 text-sm font-medium">
                <strong className="text-amber-300">Apenas 3 vagas</strong> disponíveis no plano Pro este mês
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 font-bold px-8 py-4 rounded-2xl shadow-xl shadow-orange-500/30 transition-all hover:-translate-y-1 hover:shadow-2xl text-base"
              >
                Começar gratuitamente <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={() => setVideoOpen(true)}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5 text-base backdrop-blur-sm"
              >
                <Play className="w-5 h-5 text-yellow-300" /> Ver demo
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 mt-8">
              {[
                { icon: CheckCircle2, text: 'Sem cartão de crédito' },
                { icon: CheckCircle2, text: '14 dias grátis' },
                { icon: CheckCircle2, text: 'Cancela quando quiser' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-white/60 text-xs">
                  <Icon className="w-4 h-4 text-emerald-400" /> {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right — mock dashboard */}
          <div className="relative hidden lg:block">
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/50 text-xs">Bem-vindo de volta</p>
                  <p className="text-white font-bold text-lg">João Silva 🏊</p>
                </div>
                <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl px-3 py-1.5">
                  <span className="text-emerald-300 text-xs font-semibold">Nível: Avançado</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { l: 'Técnica', v: '8.5', c: 'text-emerald-400' },
                  { l: 'Velocidade', v: '7.2', c: 'text-blue-400' },
                  { l: 'Resistência', v: '9.1', c: 'text-yellow-400' },
                ].map(({ l, v, c }) => (
                  <div key={l} className="bg-white/10 rounded-xl p-3 text-center">
                    <p className={`text-xl font-bold ${c}`}>{v}</p>
                    <p className="text-white/50 text-[10px] mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white/10 rounded-2xl p-4 mb-3">
                <div className="flex justify-between text-xs text-white/60 mb-2">
                  <span>Módulo: Costas</span><span>72%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
              <div className="flex items-start gap-3 bg-violet-500/20 border border-violet-400/30 rounded-xl p-3">
                <Brain className="w-5 h-5 text-violet-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white text-xs font-semibold mb-0.5">IA recomenda:</p>
                  <p className="text-white/70 text-[11px] leading-relaxed">Foca na rotação dos ombros durante a saída da viragem. Ver Vídeo #3 →</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-3 shadow-xl shadow-orange-500/40 animate-pulse-slow">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-gray-800 text-xs font-semibold">1.247 atletas online</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none" className="w-full">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map(({ value, suffix, label }) => (
              <div key={label}>
                <div className="text-4xl md:text-5xl font-black text-blue-600 mb-2 tabular-nums">
                  <Counter end={value} suffix={suffix} />
                </div>
                <p className="text-gray-500 text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <Zap className="w-4 h-4" /> Tudo o que precisas
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              Funcionalidades que fazem a diferença
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Uma plataforma completa, desenhada por especialistas em natação e engenheiros de IA, para maximizar o potencial de cada atleta.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <Star className="w-4 h-4 fill-yellow-500" /> 4.9/5 estrelas
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">O que dizem os nossos atletas</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Mais de 1.200 atletas e treinadores confiam na Mastchieve para transformar o seu desempenho.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map(({ name, role, text, avatar, stars }) => (
              <div key={name} className="bg-gray-50 hover:bg-white border border-gray-100 hover:border-blue-100 hover:shadow-lg rounded-2xl p-5 transition-all duration-300">
                <div className="flex items-center gap-0.5 mb-3">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">&ldquo;{text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{name}</p>
                    <p className="text-gray-400 text-xs">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <Heart className="w-4 h-4" /> Preços simples e transparentes
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Escolhe o plano certo</h2>
            <p className="text-gray-500">Sem surpresas. Sem taxas escondidas. Cancela quando quiseres.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map(({ name, price, period, desc, features: feats, cta, popular }) => (
              <div
                key={name}
                className={`relative bg-white rounded-2xl p-6 border-2 transition-all duration-300 hover:-translate-y-1 ${
                  popular
                    ? 'border-blue-500 shadow-2xl shadow-blue-500/20 scale-105'
                    : 'border-gray-100 shadow-sm hover:shadow-xl'
                }`}
              >
                {popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    MAIS POPULAR
                  </div>
                )}
                <h3 className="font-bold text-gray-900 text-lg mb-1">{name}</h3>
                <p className="text-gray-400 text-sm mb-4">{desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-gray-900">MT {price}</span>
                  <span className="text-gray-400 text-sm">{period}</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {feats.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center font-semibold py-3 rounded-xl transition-all text-sm ${
                    popular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F1F5C 0%, #1A3A9C 50%, #1A56DB 100%)' }}>
        <Particles />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Globe className="w-4 h-4" /> Disponível em Portugal e no mundo
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 leading-tight">
            Pronto para transformar<br /> o teu clube de natação?
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
            Junta-te a mais de 1.200 atletas que já estão a usar a IA para superar os seus limites. Começa hoje, sem riscos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 font-bold px-10 py-4 rounded-2xl shadow-xl shadow-orange-500/30 transition-all hover:-translate-y-1 hover:shadow-2xl text-base"
            >
              Criar conta gratuita <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-10 py-4 rounded-2xl transition-all hover:-translate-y-0.5 text-base"
            >
              Já tenho conta <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                <Waves className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">Mastchieve IA</span>
            </div>
            <p className="text-sm">© 2026 Mastchieve. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Termos</a>
              <a href="#" className="hover:text-white transition-colors">Suporte</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── VIDEO MODAL ── */}
      {videoOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setVideoOpen(false)}>
          <div className="bg-gray-900 rounded-2xl w-full max-w-3xl aspect-video flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-center text-white">
              <Play className="w-16 h-16 mx-auto mb-4 text-blue-400" />
              <p className="text-xl font-bold mb-2">Demo em breve</p>
              <p className="text-gray-400 text-sm">O vídeo de demonstração estará disponível em breve.</p>
              <button onClick={() => setVideoOpen(false)} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-colors">Fechar</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.6; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 0.3; }
        }
        .animate-float-particle { animation: float-particle linear infinite; }
      `}</style>
    </div>
  );
}
