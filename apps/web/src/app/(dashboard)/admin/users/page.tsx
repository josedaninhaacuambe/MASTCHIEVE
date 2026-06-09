'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Users, Search, Filter, RefreshCw, Shield, UserCheck, UserX,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock,
  MoreVertical, ArrowUpDown, Briefcase, GraduationCap, Bell,
} from 'lucide-react';
import { BulkNotificationsModal } from '@/components/bulk-notifications-modal';

const ROLES = ['ADMIN','INSTRUCTOR','STUDENT','PARENT','FINANCIAL','MANAGER','VISITOR'] as const;
type Role = typeof ROLES[number];

const ROLE_CFG: Record<Role, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ADMIN:      { label: 'Admin',      color: 'text-violet-700',  bg: 'bg-violet-100',  icon: Shield },
  INSTRUCTOR: { label: 'Instrutor',  color: 'text-blue-700',    bg: 'bg-blue-100',    icon: GraduationCap },
  STUDENT:    { label: 'Atleta',     color: 'text-emerald-700', bg: 'bg-emerald-100', icon: UserCheck },
  PARENT:     { label: 'Pai/Enc.',   color: 'text-orange-700',  bg: 'bg-orange-100',  icon: Users },
  FINANCIAL:  { label: 'Financeiro', color: 'text-cyan-700',    bg: 'bg-cyan-100',    icon: Briefcase },
  MANAGER:    { label: 'Gestor',     color: 'text-indigo-700',  bg: 'bg-indigo-100',  icon: Briefcase },
  VISITOR:    { label: 'Visitante',  color: 'text-gray-600',    bg: 'bg-gray-100',    icon: Users },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CFG[role as Role] ?? ROLE_CFG.VISITOR;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

function RoleModal({ userId, currentRole, onClose }: { userId: string; currentRole: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Role>(currentRole as Role);

  const mutation = useMutation({
    mutationFn: (role: string) => api.patch(`/users/${userId}/role`, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="font-bold text-gray-900 text-lg mb-1">Alterar perfil</h2>
        <p className="text-gray-500 text-sm mb-5">Seleciona o novo papel deste utilizador</p>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {ROLES.map((role) => {
            const cfg = ROLE_CFG[role];
            const Icon = cfg.icon;
            return (
              <button
                key={role}
                onClick={() => setSelected(role)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  selected === role
                    ? `${cfg.bg} ${cfg.color} border-current`
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" /> {cfg.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate(selected)}
            disabled={mutation.isPending || selected === currentRole}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition"
          >
            {mutation.isPending ? 'A guardar...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [roleModal, setRoleModal] = useState<{ id: string; role: string } | null>(null);
  const [showBulkNotif, setShowBulkNotif] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await api.get(`/users?${params}`);
      return res.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users: any[] = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, totalPages: 1 };

  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter((u) => u.role === r).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Gestão de Utilizadores</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerir perfis, papéis e acessos da plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkNotif(true)}
            className="flex items-center gap-2 px-4 py-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white rounded-xl text-sm font-medium transition"
          >
            <Bell className="w-4 h-4" /> Notificação em Massa
          </button>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['admin-users'] })}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>
      </div>

      {showBulkNotif && <BulkNotificationsModal onClose={() => setShowBulkNotif(false)} />}

      {/* KPI chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setRoleFilter('')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
            !roleFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Todos ({meta.total})
        </button>
        {ROLES.map((role) => {
          const cfg = ROLE_CFG[role];
          const Icon = cfg.icon;
          return (
            <button
              key={role}
              onClick={() => { setRoleFilter(role); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                roleFilter === role
                  ? `${cfg.bg} ${cfg.color} border-current`
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Pesquisar por email..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">A carregar utilizadores...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum utilizador encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Email', 'Perfil', 'Estado', 'Último login', 'Criado em', 'Ações'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.email[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3.5">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-full">
                          <XCircle className="w-3 h-3" /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
                        : <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Nunca</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setRoleModal({ id: u.id, role: u.role })}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
                        >
                          <ArrowUpDown className="w-3 h-3" /> Perfil
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate(u.id)}
                          disabled={toggleMutation.isPending}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                            u.isActive
                              ? 'bg-red-50 hover:bg-red-100 text-red-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.isActive ? <><UserX className="w-3 h-3" /> Desativar</> : <><UserCheck className="w-3 h-3" /> Ativar</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">{meta.total} utilizadores no total</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-gray-700">{page} / {meta.totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role change modal */}
      {roleModal && (
        <RoleModal
          userId={roleModal.id}
          currentRole={roleModal.role}
          onClose={() => setRoleModal(null)}
        />
      )}
    </div>
  );
}
