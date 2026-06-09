'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getInitials, formatDate, cn } from '@/lib/utils';
import { GraduationCap, Search, BookOpen, Users, MessageSquare } from 'lucide-react';

function StatsRow({ instructorId }: { instructorId: string }) {
  const { data } = useQuery({
    queryKey: ['instructor-stats', instructorId],
    queryFn: async () => { const { data } = await api.get(`/instructors/${instructorId}/stats`); return data.data; },
    staleTime: 60_000,
  });

  return (
    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <BookOpen className="w-3.5 h-3.5 text-mastchieve-400" />
        <span><strong className="text-gray-700">{data?.classes ?? '—'}</strong> turmas</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Users className="w-3.5 h-3.5 text-mastchieve-400" />
        <span><strong className="text-gray-700">{data?.students ?? '—'}</strong> atletas</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <MessageSquare className="w-3.5 h-3.5 text-mastchieve-400" />
        <span><strong className="text-gray-700">{data?.feedbacks ?? '—'}</strong> feedbacks</span>
      </div>
    </div>
  );
}

export default function InstructorsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['instructors', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50', ...(search && { search }) });
      const { data } = await api.get(`/instructors?${params}`);
      return data;
    },
  });

  const instructors = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instrutores</h1>
          <p className="text-gray-500 text-sm mt-1">Equipa docente e estatísticas de desempenho</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar instrutor..."
            className="text-sm bg-transparent outline-none w-48"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-mastchieve-100 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-mastchieve-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{data?.meta?.total ?? '—'}</div>
            <div className="text-xs text-gray-500">Total de instrutores</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">
              {instructors.filter((i: any) => i.isActive).length}
            </div>
            <div className="text-xs text-gray-500">Ativos</div>
          </div>
        </div>
      </div>

      {/* Instructors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))
          : instructors.map((inst: any) => (
            <div key={inst.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-mastchieve-100 rounded-full flex items-center justify-center text-mastchieve-700 font-bold text-sm flex-shrink-0">
                  {getInitials(inst.firstName, inst.lastName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">
                      {inst.firstName} {inst.lastName}
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                      inst.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {inst.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{inst.user?.email}</div>

                  {/* Specializations */}
                  {inst.specializations?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {inst.specializations.slice(0, 3).map((s: string, i: number) => (
                        <span key={i} className="text-xs bg-mastchieve-50 text-mastchieve-700 px-2 py-0.5 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bio */}
                  {inst.bio && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{inst.bio}</p>
                  )}

                  {/* Active Classes */}
                  {inst.classes?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {inst.classes.slice(0, 2).map((c: any) => (
                        <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {c.name}
                        </span>
                      ))}
                      {inst.classes.length > 2 && (
                        <span className="text-xs text-gray-400">+{inst.classes.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <StatsRow instructorId={inst.id} />

              {inst.user?.lastLoginAt && (
                <p className="text-xs text-gray-400 mt-2">
                  Último acesso: {formatDate(inst.user.lastLoginAt)}
                </p>
              )}
            </div>
          ))}
      </div>

      {!isLoading && instructors.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum instrutor encontrado</p>
        </div>
      )}
    </div>
  );
}
