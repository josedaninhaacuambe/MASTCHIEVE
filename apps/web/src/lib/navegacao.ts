/**
 * Menu da aplicação — fonte única usada pelo menu lateral e pelo Guia do Sistema.
 * Ao acrescentar um módulo aqui, ele aparece automaticamente no menu e no mapa do guia.
 */
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  ClipboardList, MessageSquare, CreditCard, BarChart3,
  LogOut, Waves, X, MessageSquareText, TrendingUp, ShieldCheck,
  Smartphone, Download, Sun, Moon, Dumbbell, Heart, Globe, UserCircle, FileText, ScrollText,
  AlertTriangle, Fish, Award, Calendar, Trophy, Megaphone, Building2, Shield, Zap, Bell,
  Briefcase, UserPlus, FileSignature, IdCard, CalendarClock, ClipboardCheck, CalendarX,
  Banknote, Gavel, FolderOpen, PieChart, Fingerprint, ChevronDown,
  Users2, Boxes, DoorOpen, MessageSquareWarning, FileBarChart, CalendarCheck, Package, FileSpreadsheet, LifeBuoy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' | 'PARENT' | 'FINANCIAL' | 'MANAGER' | 'VISITOR' | 'GESTOR_RH' | 'SUPER_ADMIN' | 'ASSISTENTE_ADMIN';

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  roles: string[];
  group?: NavGroupKey;
  badge?: string;
}

/** Perfis de colaboradores (têm acesso ao Guia do Sistema). */
export const STAFF_ROLES: string[] = ['ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR', 'MANAGER', 'FINANCIAL', 'ASSISTENTE_ADMIN', 'GESTOR_RH'];

export type NavGroupKey = 'pedagogico' | 'seguranca' | 'crm' | 'administrativo' | 'rh' | 'sistema';

export const GROUPS: Record<NavGroupKey, { label: string; icon: typeof Fish }> = {
  pedagogico: { label: 'Pedagógico', icon: Fish },
  seguranca: { label: 'Segurança', icon: Shield },
  crm: { label: 'CRM & Eventos', icon: Megaphone },
  administrativo: { label: 'Administrativo', icon: ClipboardList },
  rh: { label: 'Recursos Humanos', icon: Briefcase },
  sistema: { label: 'Sistema', icon: ShieldCheck },
};

export const navItems: NavItem[] = [
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
  { href: '/guia',              icon: LifeBuoy,         label: 'Guia do Sistema',        roles: STAFF_ROLES },
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

/** Regra base de visibilidade de um item do menu para um perfil. */
export function podeVerItem(item: Pick<NavItem, 'roles'>, role?: string | null): boolean {
  if (!role) return false;
  return role === 'SUPER_ADMIN' || item.roles.includes(role);
}
