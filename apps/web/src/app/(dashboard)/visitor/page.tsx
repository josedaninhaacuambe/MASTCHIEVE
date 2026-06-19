'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { levelLabel, cn } from '@/lib/utils';
import {
  Waves, BookOpen, Users, GraduationCap, Brain, Star,
  CheckCircle, Mail, Phone, MapPin, ChevronRight, Sparkles,
  TrendingUp, Shield, Award, Zap,
} from 'lucide-react';

const FEATURES = [
  { icon: Brain, title: 'Feedback com IA', desc: 'Relatórios personalizados gerados por inteligência artificial após cada aula.' },
  { icon: TrendingUp, title: 'Progresso em Tempo Real', desc: 'Acompanhe a evolução nos módulos de natação com gráficos detalhados.' },
  { icon: Shield, title: 'Planos Personalizados', desc: 'Planos de treino adaptados ao nível e objetivos de cada atleta.' },
  { icon: Award, title: 'Certificação por Módulos', desc: 'Sistema de progressão estruturado com níveis e certificados.' },
  { icon: Users, title: 'Gestão de Turmas', desc: 'Organização eficiente de turmas, horários e inscrições.' },
  { icon: Zap, title: 'Notificações Instantâneas', desc: 'Alertas de presenças, pagamentos e novos feedbacks em tempo real.' },
];

const PLANS = [
  {
    name: 'Atleta',
    price: 2500,
    desc: 'Para atletas individuais que querem evoluir com o apoio da IA.',
    features: ['Acesso ao painel do atleta', 'Feedback IA após cada aula', 'Progresso nos módulos', 'Histórico de presenças', 'Gestão de pagamentos'],
    highlight: false,
  },
  {
    name: 'Família',
    price: 4200,
    desc: 'Para famílias com múltiplos atletas. Inclui portal do encarregado.',
    features: ['Tudo do plano Atleta', 'Portal do encarregado', 'Até 3 atletas', 'Relatórios mensais', 'Notificações prioritárias'],
    highlight: true,
  },
  {
    name: 'Academia',
    price: null,
    desc: 'Para academias e clubes. Gestão completa com IA e administração.',
    features: ['Instrutores ilimitados', 'Turmas ilimitadas', 'KPIs e relatórios avançados', 'Planos de treino IA', 'Suporte dedicado'],
    highlight: false,
  },
];

export default function VisitorPage() {
  const { data: classesData } = useQuery({
    queryKey: ['public-classes'],
    queryFn: async () => {
      const { data } = await api.get('/classes?limit=6&status=ACTIVE');
      return data.data ?? [];
    },
    staleTime: 300_000,
  });

  const classes = classesData ?? [];

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Welcome hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-8 text-white text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
          <Waves className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black mb-2">Bem-vindo à Mastchieve</h1>
        <p className="text-blue-100 text-base max-w-lg mx-auto leading-relaxed">
          A plataforma de gestão de atletas de natação com inteligência artificial.
          Transforma dados em campeões.
        </p>
        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
          <div className="flex items-center gap-1.5 text-blue-100 text-sm">
            <Star className="w-4 h-4 text-yellow-300" /> 4.9/5 avaliação
          </div>
          <div className="flex items-center gap-1.5 text-blue-100 text-sm">
            <Users className="w-4 h-4" /> +1.200 atletas
          </div>
          <div className="flex items-center gap-1.5 text-blue-100 text-sm">
            <Sparkles className="w-4 h-4" /> IA Anthropic Claude
          </div>
        </div>
        <div className="flex gap-3 justify-center mt-6">
          <a href="/register"
            className="bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition text-sm">
            Criar conta grátis
          </a>
          <a href="/login"
            className="bg-white/20 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-white/30 transition text-sm border border-white/30">
            Já tenho conta
          </a>
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-5 text-center">
          Tudo o que precisas para gerir atletas com IA
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active classes */}
      {classes.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" /> Turmas disponíveis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {classes.map((cls: any) => {
              const occupancy = cls.maxStudents ? Math.round(((cls.enrolledCount ?? 0) / cls.maxStudents) * 100) : 0;
              return (
                <div key={cls.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{cls.name}</p>
                      <p className="text-xs text-gray-400">{levelLabel(cls.level)}</p>
                    </div>
                  </div>
                  {cls.instructor && (
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {cls.instructor.firstName} {cls.instructor.lastName}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                    <span>{cls.enrolledCount ?? 0}/{cls.maxStudents} vagas</span>
                    <span className={occupancy >= 90 ? 'text-red-500' : occupancy >= 70 ? 'text-yellow-500' : 'text-green-500'}>
                      {occupancy >= 90 ? 'Quase lotada' : occupancy >= 70 ? 'Poucos lugares' : 'Disponível'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={cn('h-1.5 rounded-full', occupancy >= 90 ? 'bg-red-400' : occupancy >= 70 ? 'bg-yellow-400' : 'bg-green-400')}
                      style={{ width: `${Math.min(occupancy, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pricing */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Planos e preços</h2>
        <p className="text-gray-500 text-sm text-center mb-6">Escolhe o plano ideal para a tua situação</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div key={plan.name}
              className={cn('rounded-2xl p-6 relative', plan.highlight
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-0 shadow-xl'
                : 'bg-white border border-gray-200')}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                  Mais popular
                </div>
              )}
              <h3 className={cn('text-lg font-bold mb-1', plan.highlight ? 'text-white' : 'text-gray-900')}>{plan.name}</h3>
              <div className="mb-3">
                {plan.price
                  ? <><span className={cn('text-3xl font-black', plan.highlight ? 'text-white' : 'text-gray-900')}>MT {plan.price}</span><span className={cn('text-sm', plan.highlight ? 'text-blue-100' : 'text-gray-400')}>/mês</span></>
                  : <span className={cn('text-xl font-bold', plan.highlight ? 'text-white' : 'text-gray-900')}>Contactar</span>}
              </div>
              <p className={cn('text-xs mb-4 leading-relaxed', plan.highlight ? 'text-blue-100' : 'text-gray-500')}>{plan.desc}</p>
              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className={cn('flex items-start gap-2 text-xs', plan.highlight ? 'text-white' : 'text-gray-600')}>
                    <CheckCircle className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', plan.highlight ? 'text-green-300' : 'text-green-500')} />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/register"
                className={cn('block text-center py-2.5 rounded-xl text-sm font-medium transition',
                  plan.highlight
                    ? 'bg-white text-blue-700 hover:bg-blue-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700')}>
                Começar agora
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contacto</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Mail, label: 'Email', value: 'info@mastchieve.co.mz' },
            { icon: Phone, label: 'Telefone', value: '+258 84 000 0000' },
            { icon: MapPin, label: 'Localização', value: 'Maputo, Moçambique' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
