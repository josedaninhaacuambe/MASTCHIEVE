'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Users, Brain, BarChart3, CheckCircle } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';

interface Step {
  icon: any;
  title: string;
  description: string;
  color: string;
}

const steps: Step[] = [
  {
    icon: Sparkles,
    title: 'Bem-vindo à Mastchieve!',
    description: 'A plataforma de gestão de natação com inteligência artificial. Vamos mostrar-te as funcionalidades principais em 4 passos rápidos.',
    color: 'from-mastchieve-600 to-violet-600',
  },
  {
    icon: Users,
    title: 'Gestão de Atletas',
    description: 'Regista e acompanha todos os atletas com perfis detalhados, historial de desempenho, módulos e pagamentos numa só plataforma.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Brain,
    title: 'Feedback com IA',
    description: 'A nossa IA (Claude) analisa o desempenho de cada atleta e gera relatórios personalizados com recomendações de treino automáticas.',
    color: 'from-violet-600 to-purple-700',
  },
  {
    icon: BarChart3,
    title: 'KPIs e Relatórios',
    description: 'Acompanha receitas, assiduidade e evolução de desempenho em tempo real. Exporta relatórios em PDF com um clique.',
    color: 'from-orange-500 to-rose-600',
  },
  {
    icon: CheckCircle,
    title: 'Pronto a começar!',
    description: 'Já podes explorar o painel. Usa o menu lateral para navegar entre secções. Boa sorte com os teus atletas!',
    color: 'from-green-500 to-emerald-600',
  },
];

export function OnboardingTour() {
  const { onboardingDone, setOnboardingDone } = useUIStore();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!onboardingDone) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [onboardingDone]);

  if (onboardingDone || !visible) return null;

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  const finish = () => {
    setVisible(false);
    setOnboardingDone();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        {/* Gradient header */}
        <div className={`bg-gradient-to-br ${current.color} px-8 pt-8 pb-10 relative`}>
          <button
            onClick={finish}
            className="absolute top-4 right-4 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">{current.title}</h2>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mt-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-white' : i < step ? 'w-3 bg-white/60' : 'w-3 bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {current.description}
          </p>

          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : finish()}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              {step > 0 ? (
                <><ChevronLeft className="w-4 h-4" /> Anterior</>
              ) : (
                'Saltar'
              )}
            </button>

            <button
              onClick={isLast ? finish : () => setStep(step + 1)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition bg-gradient-to-br ${current.color} hover:opacity-90 shadow-lg`}
            >
              {isLast ? 'Começar!' : 'Próximo'}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
