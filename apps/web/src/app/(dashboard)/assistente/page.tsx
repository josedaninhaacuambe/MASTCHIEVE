'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import {
  Users, UserPlus, GraduationCap, TrendingUp, Megaphone,
  MessageSquare, Share2, BarChart3, ClipboardList, ChevronRight, Waves,
  Users2, Boxes, DoorOpen, MessageSquareWarning, FileBarChart, CalendarCheck,
} from 'lucide-react';

export default function AssistenteDashboardPage() {
  const { user } = useAuthStore();
  const firstName = user?.profile?.firstName ?? user?.email?.split('@')[0] ?? '';

  const { data: pendentes } = useQuery({
    queryKey: ['whatsapp-pendentes-count'],
    queryFn: async () => {
      const { data } = await api.get('/whatsapp', { params: { estado: 'PENDENTE' } });
      return data.data?.length ?? 0;
    },
    staleTime: 30_000,
  });

  const atalhos = [
    { href: '/students/new', icon: UserPlus, label: 'Registar Atleta', desc: 'Lançar dados de um novo atleta', color: 'from-blue-500 to-indigo-600' },
    { href: '/rh/funcionarios', icon: Users, label: 'Registar Funcionário', desc: 'Admissão de novo colaborador', color: 'from-violet-500 to-purple-600' },
    { href: '/leads', icon: TrendingUp, label: 'Novo Lead', desc: 'CRM — captação de potenciais clientes', color: 'from-emerald-500 to-teal-600' },
    { href: '/instructors', icon: GraduationCap, label: 'Instrutores', desc: 'Consultar equipa técnica', color: 'from-amber-500 to-orange-600' },
    { href: '/comunicacao', icon: Megaphone, label: 'Comunicação', desc: 'Newsletters, informes e promoções', color: 'from-pink-500 to-rose-600' },
    { href: '/assistente/whatsapp', icon: MessageSquare, label: 'WhatsApp — Envios', desc: pendentes ? `${pendentes} mensagem${pendentes === 1 ? '' : 's'} por enviar` : 'Fila de envio pós-inscrição', color: 'from-green-500 to-emerald-600', badge: pendentes },
    { href: '/assistente/partilha', icon: Share2, label: 'Central de Partilha', desc: 'Links geridos (newsletter, open day, etc.)', color: 'from-cyan-500 to-blue-600' },
    { href: '/atendimento', icon: Users2, label: 'Atendimento e Receção', desc: 'Registo de visitantes e encaminhamentos', color: 'from-sky-500 to-blue-600' },
    { href: '/inventario', icon: Boxes, label: 'Inventário', desc: 'Stock de materiais e movimentos', color: 'from-orange-500 to-amber-600' },
    { href: '/entrada-saida', icon: DoorOpen, label: 'Entrada e Saída', desc: 'Controlo de saída de atletas', color: 'from-teal-500 to-cyan-600' },
    { href: '/reclamacoes', icon: MessageSquareWarning, label: 'Reclamações e Sugestões', desc: 'Reclamações, sugestões e elogios', color: 'from-red-500 to-rose-600' },
    { href: '/relatorios-mensais', icon: FileBarChart, label: 'Relatórios Mensais', desc: 'Snapshot mensal agregado', color: 'from-purple-500 to-violet-600' },
    { href: '/rotina-diaria', icon: CalendarCheck, label: 'Rotina Diária', desc: 'Checklist de abertura e fecho', color: 'from-lime-500 to-green-600' },
  ];
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Olá, {firstName}!</h1>
            <p className="text-blue-100 text-sm mt-1">
              Portal do Assistente Administrativo — lançamento de dados, comunicação e partilha
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Waves className="w-5 h-5 text-blue-500" /> Atalhos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {atalhos.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition group relative"
              >
                {!!a.badge && (
                  <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {a.badge}
                  </span>
                )}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-white mb-3 shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{a.label}</h3>
                <p className="text-xs text-gray-500 mt-1">{a.desc}</p>
                <p className="text-xs text-blue-600 mt-3 flex items-center gap-1 group-hover:underline">
                  Abrir <ChevronRight className="w-3 h-3" />
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
