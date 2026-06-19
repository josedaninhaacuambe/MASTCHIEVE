'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatDate, formatCurrency, getInitials, cn } from '@/lib/utils';
import {
  Users, CreditCard, MessageSquare, TrendingUp,
  ChevronRight, AlertCircle, CheckCircle, Clock,
  Calendar, Waves, Star, Activity,
} from 'lucide-react';

function AttendanceBadge({ rate }: { rate: number }) {
  const color = rate >= 80 ? 'green' : rate >= 60 ? 'yellow' : 'red';
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
      color === 'green' ? 'bg-green-100 text-green-700' :
        color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600')}>
      {rate}% assiduidade
    </span>
  );
}

export default function ParentDashboardPage() {
  const router = useRouter();

  const { data: me, isLoading } = useQuery({
    queryKey: ['parent-me'],
    queryFn: async () => { const { data } = await api.get('/parents/me'); return data.data; },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const children = me?.children ?? [];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
            <Waves className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Olá, {me?.firstName}!</h1>
            <p className="text-blue-100 text-sm mt-1">
              Portal do Encarregado de Educação — {children.length} atleta{children.length !== 1 ? 's' : ''} associado{children.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Children cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" /> Os meus atletas
        </h2>
        {children.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum atleta associado à sua conta</p>
            <p className="text-xs mt-1">Contacte o administrador para adicionar os seus filhos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((link: any) => {
              const student = link.student;
              const classes = student?.enrollments ?? [];
              const pendingPayments = student?.payments ?? [];
              const latestFeedback = student?.feedbacks?.[0];

              return (
                <div key={link.studentId}
                  className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition cursor-pointer group"
                  onClick={() => router.push(`/parent/children/${student.id}`)}>

                  {/* Child header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {getInitials(student?.firstName, student?.lastName)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{student?.firstName} {student?.lastName}</h3>
                        {link.isPrimary && (
                          <span className="text-xs text-blue-600 font-medium">Tutor principal</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition" />
                  </div>

                  {/* Classes */}
                  {classes.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1.5">Turmas inscritas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {classes.map((e: any) => (
                          <span key={e.id} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                            {e.class?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alerts */}
                  <div className="space-y-2">
                    {pendingPayments.length > 0 && (
                      <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-red-700">
                            {pendingPayments.length} pagamento{pendingPayments.length > 1 ? 's' : ''} pendente{pendingPayments.length > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-red-500 mt-0.5">
                            Total: {formatCurrency(pendingPayments.reduce((s: number, p: any) => s + p.amount, 0))}
                          </p>
                        </div>
                      </div>
                    )}
                    {latestFeedback && (
                      <div className="flex items-start gap-2 p-2.5 bg-violet-50 border border-violet-100 rounded-xl">
                        <MessageSquare className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-violet-700">Novo feedback disponível</p>
                          <p className="text-xs text-violet-500 mt-0.5 truncate">
                            {formatDate(latestFeedback.createdAt)}
                          </p>
                        </div>
                      </div>
                    )}
                    {pendingPayments.length === 0 && !latestFeedback && (
                      <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-100 rounded-xl">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <p className="text-xs text-green-700">Tudo em ordem</p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-blue-600 mt-3 flex items-center gap-1 group-hover:underline">
                    Ver detalhe completo <ChevronRight className="w-3 h-3" />
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
