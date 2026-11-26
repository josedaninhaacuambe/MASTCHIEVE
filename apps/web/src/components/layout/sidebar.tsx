'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { Logo } from '@/components/brand/Logo';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  ClipboardList, MessageSquare, CreditCard, BarChart3,
  LogOut, Waves, X, MessageSquareText, TrendingUp, ShieldCheck,
  Smartphone, Download, Sun, Moon, Dumbbell, Heart, Globe, UserCircle, FileText, ScrollText,
  AlertTriangle, Fish, Award, Calendar, Trophy, Megaphone, Building2, Shield, Zap, Bell,
  Briefcase, UserPlus, FileSignature, IdCard, CalendarClock, ClipboardCheck, CalendarX,
  Banknote, Gavel, FolderOpen, PieChart, Fingerprint, ChevronDown,
  Users2, Boxes, DoorOpen, MessageSquareWarning, FileBarChart, CalendarCheck, Package, FileSpreadsheet,
} from 'lucide-react';

type NavGroupKey = 'pedagogico' | 'seguranca' | 'crm' | 'administrativo' | 'rh' | 'sistema';

const GROUPS: Record<NavGroupKey, { label: string; icon: typeof Fish }> = {
  pedagogico: { label: 'Pedagógico', icon: Fish },
  seguranca: { label: 'Segurança', icon: Shield },
  crm: { label: 'CRM & Eventos', icon: Megaphone },
  administrativo: { label: 'Administrativo', icon: ClipboardList },
  rh: { label: 'Recursos Humanos', icon: Briefcase },
  sistema: { label: 'Sistema', icon: ShieldCheck },
};

const navItems = [
  // Admin + Manager
  { href: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard',              roles: ['ADMIN', 'STUDENT', 'FINANCIAL', 'MANAGER'] },
  { href: '/instructor',        icon: LayoutDashboard, label: 'Dashboard',              roles: ['INSTRUCTOR'] },
  { href: '/students',          icon: Users,            label: 'Atletas',                roles: ['ADMIN', 'INSTRUCTOR', 'MANAGER', 'ASSISTENTE_ADMIN'] },
  { href: '/instructors',       icon: GraduationCap,    label: 'Instrutores',            roles: ['ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN'] },
  { href: '/classes',           icon: BookOpen,         label: 'Turmas',                 roles: ['ADMIN', 'INSTRUCTOR', 'MANAGER', 'ASSISTENTE_ADMIN'] },
  { href: '/attendance',        icon: ClipboardList,    label: 'Presenças',              roles: ['ADMIN', 'INSTRUCTOR'], badge: 'Hoje' },
  { href: '/feedback',          icon: MessageSquare,    label: 'Feedback',               roles: ['ADMIN', 'INSTRUCTOR'] },
  { href: '/training-plans',    icon: Dumbbell,         label: 'Planos de Treino',       roles: ['ADMIN', 'INSTRUCTOR'] },
  { href: '/financial',         icon: CreditCard,       label: 'Financeiro',             roles: ['ADMIN', 'FINANCIAL', 'ASSISTENTE_ADMIN'] },
  { href: '/pacotes',           icon: Package,          label: 'Pacotes e Preços',       roles: ['ADMIN'] },
  { href: '/kpi',               icon: BarChart3,        label: 'KPIs',                   roles: ['ADMIN', 'MANAGER'] },
  { href: '/modules',           icon: Waves,            label: 'Módulos',                roles: ['ADMIN', 'INSTRUCTOR', 'MANAGER', 'ASSISTENTE_ADMIN'] },
  { href: '/documents',         icon: FileText,         label: 'Documentos',             roles: ['ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN'] },
  { href: '/unidades',           icon: Building2,        label: 'Unidades',               roles: ['ADMIN'] },
  { href: '/avaliacoes-iniciais', icon: ClipboardList,  label: 'Avaliações Iniciais',    roles: ['ADMIN', 'INSTRUCTOR', 'MANAGER', 'ASSISTENTE_ADMIN'], group: 'pedagogico' },
  { href: '/fases',             icon: Fish,             label: 'Fases Pedagógicas',      roles: ['ADMIN', 'INSTRUCTOR', 'MANAGER'], group: 'pedagogico' },
  { href: '/avaliacoes-agendadas', icon: ClipboardCheck, label: 'Avaliações Agendadas', roles: ['ADMIN', 'INSTRUCTOR', 'MANAGER'], group: 'pedagogico' },
  { href: '/ama',               icon: Waves,            label: 'Fase AMA',               roles: ['ADMIN', 'INSTRUCTOR'], group: 'pedagogico' },
  { href: '/intermediario',     icon: Waves,            label: 'Fase Intermédio',        roles: ['ADMIN', 'INSTRUCTOR'], group: 'pedagogico' },
  { href: '/avancado',          icon: Zap,              label: 'Fase Avançado',          roles: ['ADMIN', 'INSTRUCTOR'], group: 'pedagogico' },
  { href: '/certificados',      icon: Award,            label: 'Certificados',           roles: ['ADMIN', 'MANAGER'], group: 'pedagogico' },
  { href: '/protocolos',        icon: Shield,           label: 'Protocolos Segurança',   roles: ['ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN'], group: 'seguranca' },
  { href: '/seguranca',         icon: Zap,              label: 'Dashboard Segurança',    roles: ['ADMIN'], group: 'seguranca' },
  { href: '/incidentes',        icon: AlertTriangle,    label: 'Incidentes',             roles: ['ADMIN', 'INSTRUCTOR'], group: 'seguranca' },
  { href: '/eventos',           icon: Calendar,         label: 'Eventos / Open Days',    roles: ['ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN'], group: 'crm' },
  { href: '/competicoes',       icon: Trophy,           label: 'Competições',            roles: ['ADMIN', 'MANAGER'], group: 'crm' },
  { href: '/comunicacao',       icon: Megaphone,        label: 'Comunicação',            roles: ['ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN'], group: 'crm' },
  { href: '/admin/users',       icon: ShieldCheck,      label: 'Gestão de Utilizadores', roles: ['ADMIN'], group: 'sistema' },
  { href: '/admin/audit',       icon: ScrollText,       label: 'Audit Log',               roles: ['ADMIN'], group: 'sistema' },
  { href: '/notifications',     icon: Bell,             label: 'Notificações',             roles: ['ADMIN', 'INSTRUCTOR', 'MANAGER', 'STUDENT', 'PARENT', 'ASSISTENTE_ADMIN'] },
  // Assistente Administrativo
  { href: '/leads',             icon: TrendingUp,       label: 'CRM — Leads',            roles: ['ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN'], group: 'crm' },
  { href: '/assistente',          icon: ClipboardList, label: 'Assistente — Painel',    roles: ['ASSISTENTE_ADMIN', 'ADMIN'], group: 'administrativo' },
  { href: '/assistente/whatsapp', icon: MessageSquare, label: 'WhatsApp — Envios',      roles: ['ASSISTENTE_ADMIN'], group: 'administrativo' },
  { href: '/assistente/partilha', icon: Globe,          label: 'Central de Partilha',    roles: ['ASSISTENTE_ADMIN'], group: 'administrativo' },
  { href: '/atendimento',         icon: Users2,         label: 'Atendimento e Receção',  roles: ['ASSISTENTE_ADMIN', 'ADMIN', 'MANAGER'], group: 'administrativo' },
  { href: '/inventario',          icon: Boxes,          label: 'Inventário',             roles: ['ASSISTENTE_ADMIN', 'ADMIN', 'MANAGER'], group: 'administrativo' },
  { href: '/entrada-saida',       icon: DoorOpen,       label: 'Entrada e Saída',        roles: ['ASSISTENTE_ADMIN', 'ADMIN', 'INSTRUCTOR'], group: 'administrativo' },
  { href: '/reclamacoes',         icon: MessageSquareWarning, label: 'Reclamações e Sugestões', roles: ['ASSISTENTE_ADMIN', 'ADMIN', 'MANAGER', 'PARENT'], group: 'administrativo' },
  { href: '/relatorios-mensais',  icon: FileBarChart,   label: 'Relatórios Mensais',     roles: ['ASSISTENTE_ADMIN', 'ADMIN', 'MANAGER'], group: 'administrativo' },
  { href: '/rotina-diaria',       icon: CalendarCheck,  label: 'Rotina Diária',          roles: ['ASSISTENTE_ADMIN', 'ADMIN', 'MANAGER'], group: 'administrativo' },
  { href: '/presencas-diarias',   icon: FileSpreadsheet, label: 'Presenças Diárias',     roles: ['ASSISTENTE_ADMIN', 'ADMIN'], group: 'administrativo' },
  // Recursos Humanos — Gestor de RH + Super Admin
  { href: '/rh',                icon: Briefcase,        label: 'RH — Painel',            roles: ['GESTOR_RH', 'SUPER_ADMIN'], group: 'rh' },
  { href: '/rh/funcionarios',   icon: Users,            label: 'Funcionários',           roles: ['ADMIN', 'GESTOR_RH', 'SUPER_ADMIN', 'ASSISTENTE_ADMIN'], group: 'rh' },
  { href: '/rh/contratos',      icon: FileSignature,    label: 'Contratos',               roles: ['GESTOR_RH', 'SUPER_ADMIN'], group: 'rh' },
  { href: '/rh/certificacoes',  icon: IdCard,           label: 'Certificações',           roles: ['GESTOR_RH', 'SUPER_ADMIN'], group: 'rh' },
  { href: '/rh/escalas',        icon: CalendarClock,    label: 'Escalas',                 roles: ['GESTOR_RH', 'SUPER_ADMIN'], group: 'rh' },
  { href: '/rh/presenca',       icon: Fingerprint,      label: 'Presença Biométrica',     roles: ['GESTOR_RH', 'SUPER_ADMIN'], group: 'rh' },
  { href: '/rh/avaliacoes-desempenho', icon: ClipboardCheck, label: 'Avaliações Desempenho', roles: ['GESTOR_RH', 'SUPER_ADMIN'], group: 'rh' },
  { href: '/rh/ferias-faltas',  icon: CalendarX,        label: 'Férias / Faltas',        roles: ['GESTOR_RH', 'SUPER_ADMIN'], group: 'rh' },
  { href: '/rh/folha-pagamento', icon: Banknote,        label: 'Folha de Pagamento',     roles: ['GESTOR_RH', 'SUPER_ADMIN'], group: 'rh' },
  { href: '/rh/disciplina',     icon: Gavel,            label: 'Disciplina',              roles: ['GESTOR_RH', 'SUPER_ADMIN'], group: 'rh' },
  { href: '/rh/formacao',       icon: GraduationCap,    label: 'Formação e Inscrições',   roles: ['GESTOR_RH', 'SUPER_ADMIN', 'ADMIN', 'ASSISTENTE_ADMIN'], group: 'rh' },
  { href: '/rh/desligamento',   icon: LogOut,           label: 'Desligamento',           roles: ['GESTOR_RH', 'SUPER_ADMIN'], group: 'rh' },
  { href: '/rh/documentos',     icon: FolderOpen,       label: 'Documentos RH',          roles: ['GESTOR_RH', 'SUPER_ADMIN'], group: 'rh' },
  { href: '/rh/relatorios',     icon: PieChart,         label: 'Relatórios RH',          roles: ['GESTOR_RH', 'SUPER_ADMIN'], group: 'rh' },
  // Student only
  { href: '/student/progress',   icon: TrendingUp,    label: 'O Meu Progresso',     roles: ['STUDENT'] },
  { href: '/student/feedback',   icon: MessageSquareText, label: 'Os Meus Feedbacks',   roles: ['STUDENT'] },
  { href: '/student/attendance', icon: ClipboardList,  label: 'As Minhas Presenças', roles: ['STUDENT'] },
  { href: '/student/payments',   icon: CreditCard,     label: 'Os Meus Pagamentos',  roles: ['STUDENT'] },
  // Parent + Student (atletas podem inscrever e ver os seus próprios filhos menores)
  { href: '/parent',            icon: Heart,           label: 'Os Meus Filhos',      roles: ['PARENT', 'STUDENT'] },
  // Visitor only
  { href: '/visitor',           icon: Globe,           label: 'Explorar Mastchieve', roles: ['VISITOR'] },
];

/* Apple/Google store SVG logos inline para não depender de assets externos */
function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function PlayStoreLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.18 23.76c.31.17.66.22 1.01.14l12.45-7.19-2.63-2.63-10.83 9.68zm-1.13-20.4C1.72 3.72 2 4.18 2 4.68v14.64c0 .5.28.96.67 1.25l.09.07 8.2-8.2v-.19L2.05 3.36zm17.16 9.16L16.64 10.8 13.88 13.56l2.76 2.76 2.58-1.49c.74-.43.74-1.13 0-1.56l-.01.25zm-16.03 9.2L14.64 12 3.18 2.24c-.36-.19-.76-.2-1.12-.02-.31.17-.56.47-.56.82" />
    </svg>
  );
}

function MobileDownloadCard() {
  return (
    <div className="mx-3 mb-3 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 dark:text-white text-xs font-semibold leading-tight">App Mobile</p>
          <p className="text-gray-500 dark:text-white/50 text-[10px] leading-tight mt-0.5">iOS &amp; Android</p>
        </div>
        <Download className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      </div>

      <div className="px-3 pb-2">
        <p className="text-gray-500 dark:text-white/60 text-[10px] leading-relaxed mb-2.5">
          Acede ao teu painel, treinos e feedback em qualquer lugar.
        </p>

        {/* Store buttons */}
        <div className="space-y-1.5">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black rounded-lg px-2.5 py-2 transition-all group"
          >
            <AppleLogo />
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-[9px] leading-none">Disponível na</p>
              <p className="text-white text-[11px] font-semibold leading-tight">App Store</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" title="Em breve" />
          </a>

          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black rounded-lg px-2.5 py-2 transition-all group"
          >
            <PlayStoreLogo />
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-[9px] leading-none">Disponível no</p>
              <p className="text-white text-[11px] font-semibold leading-tight">Google Play</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" title="Em breve" />
          </a>
        </div>

        <p className="text-center text-gray-400 text-[9px] mt-2 leading-tight">Em breve • Notifica-me</p>
      </div>
    </div>
  );
}

function isActiveHref(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, closeSidebar, darkMode, toggleDarkMode } = useUIStore();

  const { data: myAccount } = useQuery({
    queryKey: ['users-me'],
    queryFn: async () => { const { data } = await api.get('/users/me'); return data.data; },
    staleTime: 60_000,
    enabled: user?.role === 'PARENT',
  });
  const hasOwnStudentProfile = !!myAccount?.student;

  const filtered = navItems.filter((item) => {
    if (item.roles.includes(user?.role || '') || user?.role === 'SUPER_ADMIN') return true;
    if (user?.role === 'PARENT' && hasOwnStudentProfile && item.href.startsWith('/student/')) return true;
    return false;
  });
  const firstName = user?.profile?.firstName ?? user?.email?.split('@')[0] ?? '?';
  const initials = firstName[0]?.toUpperCase() ?? '?';

  const showMobileDownload = user?.role === 'STUDENT' || user?.role === 'INSTRUCTOR';

  const activeGroup = filtered.find((item) => item.group && isActiveHref(pathname, item.href))?.group as NavGroupKey | undefined;
  const [openGroups, setOpenGroups] = useState<Set<NavGroupKey>>(new Set(activeGroup ? [activeGroup] : []));

  useEffect(() => {
    if (activeGroup) {
      setOpenGroups((prev) => (prev.has(activeGroup) ? prev : new Set(prev).add(activeGroup)));
    }
  }, [activeGroup]);

  const toggleGroup = (key: NavGroupKey) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const renderedGroups = new Set<NavGroupKey>();

  const renderNavLink = (item: (typeof navItems)[number]) => {
    const Icon = item.icon;
    const active = isActiveHref(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={closeSidebar}
        className={cn(
          'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150',
          active
            ? 'bg-brand-blue/[0.08] text-brand-blue font-semibold dark:bg-white/10 dark:text-white'
            : 'text-gray-600 font-medium hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
        )}
      >
        {active && (
          <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-red rounded-r-full" />
        )}
        <Icon className={cn('w-[18px] h-[18px] flex-shrink-0', active ? 'text-brand-blue dark:text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200')} />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge && (
          <span className="text-[10px] font-semibold bg-brand-green/10 text-brand-green px-1.5 py-0.5 rounded-full leading-none">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 flex flex-col overflow-hidden',
        'transform transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:relative lg:flex-shrink-0 lg:translate-x-0 lg:z-auto',
        'bg-white border-r border-gray-200 dark:bg-gray-950 dark:border-white/10',
      )}
    >

      {/* ── LOGO ── */}
      <div className="relative h-16 px-5 flex items-center justify-between border-b border-gray-100 dark:border-white/10 mb-3">
        <Link href="/dashboard" onClick={closeSidebar} aria-label="Mastchieve — início">
          <Logo fundo="auto" className="h-7" />
        </Link>
        <button
          onClick={closeSidebar}
          className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/10 dark:hover:text-white rounded-lg transition"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── USER ROLE BADGE ── */}
      {user?.role === 'STUDENT' && (
        <div className="mx-3 mb-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
          <div className="text-gray-500 dark:text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Portal do Atleta</div>
          <div className="text-gray-900 dark:text-white font-semibold text-sm truncate">{firstName}</div>
        </div>
      )}
      {user?.role === 'INSTRUCTOR' && (
        <div className="mx-3 mb-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
          <div className="text-gray-500 dark:text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Portal do Instrutor</div>
          <div className="text-gray-900 dark:text-white font-semibold text-sm truncate">{firstName}</div>
        </div>
      )}
      {user?.role === 'PARENT' && (
        <div className="mx-3 mb-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
          <div className="text-gray-500 dark:text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Portal do Encarregado</div>
          <div className="text-gray-900 dark:text-white font-semibold text-sm truncate">{firstName}</div>
        </div>
      )}
      {user?.role === 'VISITOR' && (
        <div className="mx-3 mb-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
          <div className="text-gray-500 dark:text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Modo Visitante</div>
          <div className="text-gray-900 dark:text-white font-semibold text-sm truncate">{firstName}</div>
        </div>
      )}
      {user?.role === 'ASSISTENTE_ADMIN' && (
        <div className="mx-3 mb-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
          <div className="text-gray-500 dark:text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Portal do Assistente Administrativo</div>
          <div className="text-gray-900 dark:text-white font-semibold text-sm truncate">{firstName}</div>
        </div>
      )}

      {/* ── NAV ── */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto space-y-0.5">
        {filtered.map((item) => {
          if (!item.group) return renderNavLink(item);

          const groupKey = item.group as NavGroupKey;
          if (renderedGroups.has(groupKey)) return null;
          renderedGroups.add(groupKey);

          const groupItems = filtered.filter((i) => i.group === groupKey);
          const meta = GROUPS[groupKey];
          const GroupIcon = meta.icon;
          const isOpen = openGroups.has(groupKey);

          return (
            <div key={groupKey}>
              <button
                type="button"
                onClick={() => toggleGroup(groupKey)}
                className="group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors duration-150"
              >
                <GroupIcon className="w-[18px] h-[18px] flex-shrink-0 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                <span className="flex-1 text-left truncate">{meta.label}</span>
                <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform flex-shrink-0', isOpen ? '' : '-rotate-90')} />
              </button>
              {isOpen && (
                <div className="ml-5 pl-3 border-l border-gray-200 dark:border-white/10 space-y-0.5 mt-0.5 mb-1">
                  {groupItems.map((groupItem) => renderNavLink(groupItem))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── MOBILE APP DOWNLOAD ── */}
      {showMobileDownload && (
        <div className="mt-2">
          <div className="px-5 mb-2">
            <div className="h-px bg-gray-100 dark:bg-white/10" />
          </div>
          <MobileDownloadCard />
        </div>
      )}

      {/* ── USER FOOTER ── */}
      <div className={cn('relative p-3 border-t border-gray-100 dark:border-white/10', !showMobileDownload && 'mt-2')}>
        <button
          onClick={() => { router.push('/profile'); closeSidebar(); }}
          className="flex items-center gap-3 px-2 mb-2 w-full rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 py-1.5 transition group">
          <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-gray-900 dark:text-white text-xs font-semibold truncate">{user?.email}</div>
            <div className="text-gray-400 text-[10px] mt-0.5 uppercase tracking-wide">{user?.role}</div>
          </div>
          <UserCircle className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition flex-shrink-0" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            title={darkMode ? 'Modo claro' : 'Modo escuro'}
            className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-white/5 dark:hover:text-white rounded-lg text-sm transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="text-xs">{darkMode ? 'Claro' : 'Escuro'}</span>
          </button>
          <button
            onClick={() => { logout(); closeSidebar(); }}
            className="flex-1 flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-white/5 dark:hover:text-white rounded-lg text-sm transition-colors group"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
