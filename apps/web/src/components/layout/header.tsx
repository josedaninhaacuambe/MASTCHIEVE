'use client';

import { Bell, Search, Wifi, WifiOff, X, Menu, CheckCheck, Info, AlertTriangle, CheckCircle, CreditCard, Activity, Brain, Users, BookOpen } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import api from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* ── Notification type config ───────────────────────────────────────────── */
const TYPE_CFG: Record<string, { label: string; icon: any; color: string; bg: string; dot: string }> = {
  PAYMENT_DUE:        { label: 'Pagamento',    icon: CreditCard,      color: 'text-amber-600',  bg: 'bg-amber-100',   dot: 'bg-amber-500' },
  ATTENDANCE_ALERT:   { label: 'Assiduidade',  icon: Activity,        color: 'text-orange-600', bg: 'bg-orange-100',  dot: 'bg-orange-500' },
  PERFORMANCE_UPDATE: { label: 'Desempenho',   icon: Brain,           color: 'text-violet-600', bg: 'bg-violet-100',  dot: 'bg-violet-500' },
  SUCCESS:            { label: 'Sucesso',       icon: CheckCircle,     color: 'text-emerald-600',bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
  WARNING:            { label: 'Aviso',         icon: AlertTriangle,   color: 'text-yellow-600', bg: 'bg-yellow-100',  dot: 'bg-yellow-500' },
  INFO:               { label: 'Informação',    icon: Info,            color: 'text-blue-600',   bg: 'bg-blue-100',    dot: 'bg-blue-500' },
  SYSTEM:             { label: 'Sistema',       icon: Info,            color: 'text-gray-600',   bg: 'bg-gray-100',    dot: 'bg-gray-400' },
};
const defaultCfg = TYPE_CFG.INFO;

/* ── Toast system ───────────────────────────────────────────────────────── */
interface ToastItem { id: string; title: string; body?: string; type: string }

let toastListeners: ((t: ToastItem) => void)[] = [];
export function pushToast(t: ToastItem) { toastListeners.forEach((fn) => fn(t)); }

function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (t: ToastItem) => {
      setToasts((prev) => [t, ...prev].slice(0, 5));
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 5000);
    };
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter((fn) => fn !== handler); };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const cfg = TYPE_CFG[t.type] ?? defaultCfg;
        const Icon = cfg.icon;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 bg-white border border-gray-200 rounded-2xl shadow-2xl px-4 py-3 w-80 animate-slide-up"
            style={{ boxShadow: '0 8px 32px -4px rgba(0,0,0,0.18)' }}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
              <Icon className={`w-4 h-4 ${cfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight">{t.title}</p>
              {t.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.body}</p>}
            </div>
            <button
              onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
              className="text-gray-300 hover:text-gray-500 transition flex-shrink-0 mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ── Highlight matched text ─────────────────────────────────────────────── */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-bold text-gray-900">{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
}

/* ── Level badge colors ─────────────────────────────────────────────────── */
const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: 'bg-gray-100 text-gray-600',
  BRONZE:   'bg-amber-100 text-amber-700',
  SILVER:   'bg-slate-100 text-slate-600',
  GOLD:     'bg-yellow-100 text-yellow-700',
  DIAMOND:  'bg-cyan-100 text-cyan-700',
  ELITE:    'bg-violet-100 text-violet-700',
};

/* ── Global search panel ─────────────────────────────────────────────────── */
function GlobalSearchPanel({
  searchQuery,
  onClose,
}: {
  searchQuery: string;
  onClose: () => void;
}) {
  const router = useRouter();

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['global-search', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return null;
      const [studentsResp, classesResp] = await Promise.all([
        api.get(`/students?search=${encodeURIComponent(searchQuery)}&limit=5`).catch(() => ({ data: { data: [] } })),
        api.get(`/classes?search=${encodeURIComponent(searchQuery)}&limit=3`).catch(() => ({ data: { data: [] } })),
      ]);
      return {
        students: (studentsResp.data.data ?? studentsResp.data ?? []) as any[],
        classes: (classesResp.data.data ?? classesResp.data ?? []) as any[],
      };
    },
    enabled: searchQuery.length >= 2,
    staleTime: 5000,
  });

  const handleResultClick = (href: string) => {
    onClose();
    router.push(href);
  };

  const students: any[] = searchResults?.students ?? [];
  const classes: any[] = searchResults?.classes ?? [];
  const hasResults = students.length > 0 || classes.length > 0;

  return (
    <div
      className="absolute left-0 top-full mt-1.5 w-full min-w-[340px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
      style={{ boxShadow: '0 16px 48px -8px rgba(0,0,0,0.18)' }}
    >
      {/* Loading state */}
      {searchLoading && (
        <div className="p-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!searchLoading && searchQuery.length >= 2 && (
        <>
          {!hasResults ? (
            <div className="px-4 py-8 text-center">
              <Search className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">
                Nenhum resultado para <span className="font-semibold text-gray-700">&ldquo;{searchQuery}&rdquo;</span>
              </p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {/* Athletes section */}
              {students.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1.5 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Atletas</span>
                  </div>
                  {students.map((student: any) => {
                    const firstName = student.profile?.firstName ?? student.firstName ?? '';
                    const lastName = student.profile?.lastName ?? student.lastName ?? '';
                    const fullName = `${firstName} ${lastName}`.trim() || student.email;
                    const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || (student.email?.[0]?.toUpperCase() ?? '?');
                    const email = student.user?.email ?? student.email ?? '';
                    const level = student.currentLevel ?? student.level ?? 'BEGINNER';
                    return (
                      <button
                        key={student.id}
                        onClick={() => handleResultClick(`/students/${student.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A3A9C] to-[#1A56DB] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate leading-tight">
                            <Highlight text={fullName} query={searchQuery} />
                          </p>
                          {email && (
                            <p className="text-xs text-gray-400 truncate leading-tight">
                              <Highlight text={email} query={searchQuery} />
                            </p>
                          )}
                        </div>
                        {level && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${LEVEL_COLORS[level] ?? LEVEL_COLORS.BEGINNER}`}>
                            {level}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Classes section */}
              {classes.length > 0 && (
                <div>
                  {students.length > 0 && <div className="mx-4 h-px bg-gray-100 my-1" />}
                  <div className="px-4 pt-2 pb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Turmas</span>
                  </div>
                  {classes.map((cls: any) => {
                    const instructorName = cls.instructor
                      ? `${cls.instructor.firstName ?? ''} ${cls.instructor.lastName ?? ''}`.trim()
                      : cls.instructorName ?? '';
                    const level = cls.level ?? '';
                    return (
                      <button
                        key={cls.id}
                        onClick={() => handleResultClick(`/classes/${cls.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate leading-tight">
                            <Highlight text={cls.name} query={searchQuery} />
                          </p>
                          {instructorName && (
                            <p className="text-xs text-gray-400 truncate leading-tight">{instructorName}</p>
                          )}
                        </div>
                        {level && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${LEVEL_COLORS[level] ?? 'bg-gray-100 text-gray-600'}`}>
                            {level}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Main header ─────────────────────────────────────────────────────────── */
export function Header() {
  const user = useAuthStore((s) => s.user);
  const { toggleSidebar } = useUIStore();
  const qc = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState('');

  /* Search state */
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  /* Online/offline */
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  /* Click outside — notifications panel */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Click outside — search panel */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Escape key closes search */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setGlobalSearch('');
        searchInputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showSearch]);

  /* WebSocket — real-time notifications */
  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4301';

    // Use polling first to avoid "WebSocket closed before connection" race condition
    // during React hot-reload / StrictMode double-invoke.
    // socket.io upgrades to WebSocket automatically after the first poll succeeds.
    const socket = io(`${wsUrl}/notifications`, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 10,
      timeout: 10000,
      autoConnect: false,
    });

    socket.on('connect', () => {
      if (mounted) socket.emit('join', user.id);
    });

    socket.on('connect_error', () => {
      // Silently ignore — API may be starting up; socket.io will retry automatically
    });

    socket.on('notification', (data: any) => {
      if (!mounted) return;
      qc.invalidateQueries({ queryKey: ['notifications'] });
      pushToast({
        id: data.id ?? Math.random().toString(),
        title: data.title,
        body: data.body,
        type: data.type ?? 'INFO',
      });
    });

    socketRef.current = socket;
    socket.connect();

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [user?.id, qc]);

  /* Fetch notifications */
  const { data: notifResp } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications?limit=15');
      return data as { data: any[]; meta: { total: number; unread: number } };
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
    enabled: !!user,
  });

  const notifications: any[] = notifResp?.data ?? [];
  const unreadCount: number = notifResp?.meta?.unread ?? 0;

  /* Mark read */
  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  /* Filter (notification panel) */
  const filtered = search
    ? notifications.filter((n) =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.body?.toLowerCase().includes(search.toLowerCase()),
      )
    : notifications;

  const firstName = user?.profile?.firstName ?? user?.email?.split('@')[0] ?? '?';
  const initials = firstName.slice(0, 2).toUpperCase();

  const handleSearchFocus = () => {
    if (searchBlurTimer.current) clearTimeout(searchBlurTimer.current);
    setShowSearch(true);
  };

  const handleSearchBlur = () => {
    searchBlurTimer.current = setTimeout(() => {
      setShowSearch(false);
    }, 150);
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setGlobalSearch('');
  };

  return (
    <>
      <ToastContainer />

      <header className="h-14 md:h-16 bg-white border-b border-gray-100 flex items-center justify-between px-3 md:px-6 flex-shrink-0 gap-3 shadow-sm">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global search with dropdown */}
          <div className="hidden sm:block relative" ref={searchRef}>
            <div className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition rounded-xl px-3 md:px-4 py-2 w-44 md:w-72">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                placeholder="Pesquisar atletas, turmas..."
                className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none flex-1 min-w-0"
              />
              {globalSearch && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur firing first
                    setGlobalSearch('');
                    setShowSearch(false);
                    searchInputRef.current?.focus();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown results panel */}
            {showSearch && globalSearch.length >= 2 && (
              <GlobalSearchPanel
                searchQuery={globalSearch}
                onClose={handleCloseSearch}
              />
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Connectivity badge */}
          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full transition-all ${
            isOnline ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-red-700 bg-red-50 border border-red-100'
          }`}>
            {isOnline
              ? <><Wifi className="w-3 h-3" /><span className="hidden md:inline">Online</span></>
              : <><WifiOff className="w-3 h-3" /><span className="hidden md:inline">Offline</span></>}
          </div>

          {/* Notification bell */}
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setShowNotifs((v) => !v)}
              className={`relative p-2 rounded-xl transition-all ${
                showNotifs ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-white animate-badge-pop">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification panel */}
            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
                style={{ boxShadow: '0 20px 60px -10px rgba(0,0,0,0.18)' }}>

                {/* Panel header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-gray-600" />
                    <span className="font-bold text-gray-900 text-sm">Notificações</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={markAllReadMutation.isPending}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 hover:bg-blue-50 rounded-lg transition"
                        title="Marcar todas como lidas"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ler todas</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifs(false)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Search inside panel */}
                {notifications.length > 4 && (
                  <div className="px-3 py-2 border-b border-gray-50">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
                      <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filtrar notificações..."
                        className="bg-transparent text-xs text-gray-600 placeholder-gray-400 outline-none flex-1"
                      />
                    </div>
                  </div>
                )}

                {/* List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Bell className="w-5 h-5 opacity-40" />
                      </div>
                      <p className="text-sm font-medium">Sem notificações</p>
                      <p className="text-xs mt-0.5">Tudo em dia por aqui</p>
                    </div>
                  ) : (
                    filtered.map((n: any) => {
                      const cfg = TYPE_CFG[n.type] ?? defaultCfg;
                      const Icon = cfg.icon;
                      const isUnread = !n.readAt;
                      return (
                        <button
                          key={n.id}
                          onClick={() => isUnread && markReadMutation.mutate(n.id)}
                          className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group ${
                            isUnread ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          {/* Icon */}
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm leading-tight ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                {n.title}
                              </p>
                              {isUnread && (
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
                              )}
                            </div>
                            {n.body && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                              <span className={`text-[9px] font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                              <span>·</span>
                              <span>{timeAgo(n.createdAt)}</span>
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{notifResp?.meta?.total ?? 0} no total</span>
                    <button className="text-xs text-blue-600 hover:underline font-medium">
                      Ver histórico completo
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-[#1A3A9C] to-[#1A56DB] flex items-center justify-center text-white text-xs font-bold cursor-pointer flex-shrink-0 ring-2 ring-blue-200 shadow-sm">
              {initials}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-gray-900 leading-tight">{firstName}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-tight">{user?.role}</p>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
