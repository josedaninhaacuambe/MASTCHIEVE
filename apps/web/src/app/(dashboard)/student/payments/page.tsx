'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import {
  CreditCard, CheckCircle, Clock, AlertCircle, TrendingUp,
  Calendar, Copy, Check, Phone, Mail, ChevronLeft,
  ChevronRight, Printer, X, Receipt, Banknote, Wallet,
  Star, Info, Download, History, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const METHOD_LABEL: Record<string, string> = { CASH: 'Numerário', TRANSFER: 'Transferência', VISA_CARD: 'Cartão Visa', EMOLA: 'e-Mola', MPESA: 'M-Pesa' };

function daysUntil(date: string | Date): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function paymentKey(p: any): string {
  if (p.monthlyFee) return `${p.monthlyFee.year}-${String(p.monthlyFee.month).padStart(2, '0')}`;
  return `${new Date(p.dueDate).getFullYear()}-${String(new Date(p.dueDate).getMonth() + 1).padStart(2, '0')}`;
}

const STATUS_CFG: Record<string, { label: string; icon: any; pill: string; bg: string; border: string; circle: string }> = {
  PAID:      { label: 'Pago',       icon: CheckCircle, pill: 'bg-green-100 text-green-700 border-green-200', bg: 'bg-green-50',  border: 'border-green-200', circle: 'bg-green-500' },
  PENDING:   { label: 'Pendente',   icon: Clock,       pill: 'bg-amber-100 text-amber-700 border-amber-200', bg: 'bg-amber-50',  border: 'border-amber-200', circle: 'bg-amber-400' },
  OVERDUE:   { label: 'Em atraso',  icon: AlertCircle, pill: 'bg-red-100 text-red-700 border-red-200',       bg: 'bg-red-50',    border: 'border-red-200',   circle: 'bg-red-500' },
  CANCELLED: { label: 'Cancelado',  icon: X,           pill: 'bg-gray-100 text-gray-600 border-gray-200',   bg: 'bg-gray-50',   border: 'border-gray-200',  circle: 'bg-gray-400' },
};

// ─── Receipt modal ────────────────────────────────────────────────────────────

function ReceiptModal({ payment, onClose }: { payment: any; onClose: () => void }) {
  const month = payment.monthlyFee ? MONTHS_FULL[payment.monthlyFee.month - 1] : '—';
  const year  = payment.monthlyFee?.year ?? new Date(payment.dueDate).getFullYear();

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-br from-mastchieve-600 to-mastchieve-700 text-white rounded-t-3xl p-6 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div className="text-xs text-white/70 uppercase tracking-widest">Recibo de Pagamento</div>
          <div className="text-2xl font-bold mt-1">Mastchieve</div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(payment.amount)}</div>
            <div className="text-sm text-gray-500 mt-1">Mensalidade {month} {year}</div>
          </div>

          <div className="border border-dashed border-gray-200 rounded-2xl divide-y divide-dashed divide-gray-200">
            {[
              { label: 'Nº Recibo', value: payment.receiptNumber ?? '—', mono: true },
              { label: 'Data de Pagamento', value: payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('pt-PT') : '—' },
              { label: 'Data de Vencimento', value: new Date(payment.dueDate).toLocaleDateString('pt-PT') },
              { label: 'Método', value: METHOD_LABEL[payment.method] ?? payment.method ?? '—' },
              { label: 'Estado', value: STATUS_CFG[payment.status]?.label ?? payment.status },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-500">{row.label}</span>
                <span className={cn('font-semibold text-gray-900', row.mono && 'font-mono text-xs')}>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="text-center text-[10px] text-gray-400">
            Este documento serve como comprovativo de pagamento.
          </div>
        </div>

        <div className="p-4 pt-0 grid grid-cols-2 gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button onClick={onClose} className="flex items-center justify-center gap-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white py-2.5 rounded-xl text-sm font-medium transition">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment row ─────────────────────────────────────────────────────────────

function PaymentRow({ payment, onViewReceipt }: { payment: any; onViewReceipt: (p: any) => void }) {
  const [copied, setCopied] = useState(false);
  const cfg = STATUS_CFG[payment.status] ?? STATUS_CFG.PENDING;
  const Icon = cfg.icon;
  const days = daysUntil(payment.dueDate);
  const month = payment.monthlyFee ? `Mensalidade ${payment.monthlyFee.month}/${payment.monthlyFee.year}` : 'Mensalidade';

  const copyReceipt = useCallback(async () => {
    if (!payment.receiptNumber) return;
    await navigator.clipboard.writeText(payment.receiptNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [payment.receiptNumber]);

  return (
    <div className={cn('p-4 flex items-start gap-3 transition', payment.status === 'OVERDUE' && 'bg-red-50/50')}>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border mt-0.5', cfg.bg, cfg.border)}>
        <Icon className={cn('w-4 h-4', payment.status === 'PAID' ? 'text-green-600' : payment.status === 'OVERDUE' ? 'text-red-600' : payment.status === 'PENDING' ? 'text-amber-600' : 'text-gray-500')} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold text-sm text-gray-900">{month}</div>
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</div>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.pill)}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
          <span className="text-xs text-gray-400">
            Vence: {new Date(payment.dueDate).toLocaleDateString('pt-PT')}
          </span>
          {payment.paidAt && (
            <span className="text-xs text-gray-400">
              · Pago: {new Date(payment.paidAt).toLocaleDateString('pt-PT')}
            </span>
          )}
          {payment.method && payment.status === 'PAID' && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
              {METHOD_LABEL[payment.method] ?? payment.method}
            </span>
          )}
          {payment.status === 'PENDING' && days > 0 && days <= 7 && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
              {days}d para vencer
            </span>
          )}
          {payment.status === 'OVERDUE' && (
            <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
              {Math.abs(days)}d em atraso
            </span>
          )}
        </div>

        {/* Receipt number */}
        {payment.receiptNumber && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
              {payment.receiptNumber}
            </span>
            <button
              onClick={copyReceipt}
              className="flex items-center gap-1 text-xs text-mastchieve-600 hover:text-mastchieve-700 transition"
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <button
              onClick={() => onViewReceipt(payment)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition ml-auto"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Recibo</span>
            </button>
          </div>
        )}

        {payment.notes && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5">
            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
            {payment.notes}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Year history row ─────────────────────────────────────────────────────────

function YearHistoryRow({ year, payments, isSelected, onClick }: {
  year: number; payments: any[]; isSelected: boolean; onClick: () => void;
}) {
  const paid    = payments.filter((p) => p.status === 'PAID');
  const overdue = payments.filter((p) => p.status === 'OVERDUE');
  const pending = payments.filter((p) => p.status === 'PENDING');
  const totalPaid = paid.reduce((s, p) => s + p.amount, 0);
  const compliance = payments.length ? Math.round((paid.length / payments.length) * 100) : 0;
  const isCurrent = year === new Date().getFullYear();

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-200 text-left',
        isSelected
          ? 'border-mastchieve-400 bg-mastchieve-50 shadow-sm'
          : 'border-gray-100 bg-white hover:border-gray-200',
      )}
    >
      {/* Year badge */}
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold',
        isSelected ? 'bg-mastchieve-600 text-white' : 'bg-gray-100 text-gray-700',
      )}>
        {String(year).slice(2)}
        <span className="text-[8px] opacity-70 ml-0.5">{String(year).slice(0, 2)}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{year}</span>
          {isCurrent && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">atual</span>}
          {overdue.length > 0 && (
            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">
              {overdue.length} em atraso
            </span>
          )}
        </div>
        {/* Mini compliance bar */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', compliance === 100 ? 'bg-green-500' : compliance >= 70 ? 'bg-amber-500' : 'bg-red-500')}
              style={{ width: `${compliance}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 flex-shrink-0">{paid.length}/{payments.length} pagos</span>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="text-sm font-bold text-gray-900">{formatCurrency(totalPaid)}</div>
        <div className={cn('text-[10px] font-semibold', compliance === 100 ? 'text-green-600' : 'text-gray-400')}>
          {compliance}% cumprido
        </div>
      </div>

      <ChevronRight className={cn('w-4 h-4 flex-shrink-0 transition-transform', isSelected && 'text-mastchieve-600 rotate-90')} />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentPaymentsPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('');
  const [receiptPayment, setReceiptPayment] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['my-payments'],
    queryFn: async () => {
      const { data } = await api.get('/financial/me');
      return data;
    },
  });

  const allPayments: any[] = data?.data ?? [];

  // Years: prefer API metadata, fallback to computing from payments
  const years = useMemo(() => {
    if (data?.meta?.years?.length) return data.meta.years as number[];
    const set = new Set<number>();
    allPayments.forEach((p) => {
      const y = p.monthlyFee?.year ?? new Date(p.dueDate).getFullYear();
      set.add(y);
    });
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [data, allPayments]);

  // Payments grouped by year (for history view)
  const byYear = useMemo(() => {
    const map = new Map<number, any[]>();
    allPayments.forEach((p) => {
      const y = p.monthlyFee?.year ?? new Date(p.dueDate).getFullYear();
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(p);
    });
    return map;
  }, [allPayments]);

  const hasPastYears = years.length > 1;
  const selectedYearIdx = years.indexOf(selectedYear);

  const goNextYear = () => {
    const idx = years.indexOf(selectedYear);
    if (idx > 0) setSelectedYear(years[idx - 1]);
  };
  const goPrevYear = () => {
    const idx = years.indexOf(selectedYear);
    if (idx < years.length - 1) setSelectedYear(years[idx + 1]);
  };

  // Calendar map for selected year
  const calendarMap = useMemo(() => {
    const map: Record<string, any> = {};
    allPayments
      .filter((p) => (p.monthlyFee?.year ?? new Date(p.dueDate).getFullYear()) === selectedYear)
      .forEach((p) => { map[paymentKey(p)] = p; });
    return map;
  }, [allPayments, selectedYear]);

  // Filtered payments for list
  const filtered = useMemo(() => {
    return allPayments.filter((p) => {
      const y = p.monthlyFee?.year ?? new Date(p.dueDate).getFullYear();
      if (y !== selectedYear) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      return true;
    });
  }, [allPayments, selectedYear, statusFilter]);

  // Global stats
  const paid    = allPayments.filter((p) => p.status === 'PAID');
  const overdue = allPayments.filter((p) => p.status === 'OVERDUE');
  const pending = allPayments.filter((p) => p.status === 'PENDING');
  const totalPaid  = paid.reduce((s, p) => s + p.amount, 0);
  const totalOwed  = [...overdue, ...pending].reduce((s, p) => s + p.amount, 0);
  const nextPending = [...pending, ...overdue].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  const nextDays  = nextPending ? daysUntil(nextPending.dueDate) : null;
  const allGood   = overdue.length === 0 && pending.length === 0;
  const complianceRate = allPayments.length ? Math.round((paid.length / allPayments.length) * 100) : 100;

  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Os Meus Pagamentos</h1>
        <p className="text-gray-500 text-sm mt-1">Historial de mensalidades e situação financeira</p>
      </div>

      {/* All good banner */}
      {allGood && allPayments.length > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Star className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="font-bold">Pagamentos em dia!</div>
            <div className="text-sm text-white/80">Excelente historial de pagamento. Continua assim!</div>
          </div>
          <CheckCircle className="w-6 h-6 text-white/60 ml-auto flex-shrink-0" />
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 opacity-80" />
            <span className="text-xs text-white/70 font-medium uppercase tracking-wide">Total pago</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
          <div className="text-white/60 text-xs mt-1">{paid.length} pagamento{paid.length !== 1 ? 's' : ''}</div>
        </div>

        <div className={cn(
          'rounded-2xl p-4 text-white',
          overdue.length > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600' : pending.length > 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-blue-600',
        )}>
          <div className="flex items-center gap-2 mb-2">
            {overdue.length > 0 ? <AlertCircle className="w-4 h-4 opacity-80" /> : <Wallet className="w-4 h-4 opacity-80" />}
            <span className="text-xs text-white/70 font-medium uppercase tracking-wide">
              {overdue.length > 0 ? 'Em atraso' : 'Pendente'}
            </span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalOwed)}</div>
          <div className="text-white/60 text-xs mt-1">
            {overdue.length > 0 ? `${overdue.length} em atraso!` : pending.length > 0 ? `${pending.length} por pagar` : 'Tudo em dia ✓'}
          </div>
        </div>

        {/* Compliance rate */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-mastchieve-500" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Cumprimento</span>
          </div>
          <div className={cn('text-2xl font-bold', complianceRate >= 90 ? 'text-green-600' : complianceRate >= 70 ? 'text-amber-600' : 'text-red-500')}>
            {complianceRate}%
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', complianceRate >= 90 ? 'bg-green-500' : complianceRate >= 70 ? 'bg-amber-500' : 'bg-red-500')}
              style={{ width: `${complianceRate}%` }}
            />
          </div>
        </div>

        {/* Next payment */}
        <div className={cn('rounded-2xl p-4 border', nextPending ? (overdue.length > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200') : 'bg-white border-gray-100')}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className={cn('w-4 h-4', nextPending ? (overdue.length > 0 ? 'text-red-500' : 'text-amber-500') : 'text-gray-400')} />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Próximo</span>
          </div>
          {nextPending ? (
            <>
              <div className={cn('text-2xl font-bold', overdue.length > 0 ? 'text-red-600' : 'text-amber-700')}>
                {nextDays !== null && nextDays <= 0 ? `${Math.abs(nextDays)}d` : nextDays !== null ? `${nextDays}d` : '—'}
              </div>
              <div className={cn('text-xs mt-1', overdue.length > 0 ? 'text-red-500' : 'text-amber-600')}>
                {nextDays !== null && nextDays <= 0 ? 'em atraso' : 'para vencer'}
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-gray-400">—</div>
              <div className="text-xs text-gray-400 mt-1">Sem pendentes</div>
            </>
          )}
        </div>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-red-800 text-sm">
                {overdue.length} pagamento{overdue.length !== 1 ? 's' : ''} em atraso — total {formatCurrency(overdue.reduce((s, p) => s + p.amount, 0))}
              </div>
              <p className="text-xs text-red-600 mt-1">
                Regulariza a situação o mais breve possível para evitar a suspensão do acesso às aulas.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <a href="tel:+351000000000" className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-2 rounded-xl transition">
              <Phone className="w-3.5 h-3.5" /> Ligar ao clube
            </a>
            <a href="mailto:pagamentos@mastchieve.co.mz" className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-2 rounded-xl transition">
              <Mail className="w-3.5 h-3.5" /> Enviar email
            </a>
          </div>
        </div>
      )}

      {/* ── Historical summary (collapsible, only when there are past years) ── */}
      {hasPastYears && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50/50 transition"
          >
            <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <History className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-gray-900">Histórico por Ano</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {years.length} anos de histórico · {allPayments.filter((p) => p.status === 'PAID').length} pagamentos efectuados
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                {formatCurrency(allPayments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0))} total
              </span>
              {showHistory ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </button>

          {showHistory && (
            <div className="px-4 pb-4 space-y-2 border-t border-gray-50 pt-4">
              {/* All-time stats bar */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Anos activo', value: String(years.length), color: 'text-gray-900' },
                  { label: 'Pagamentos', value: String(allPayments.filter((p) => p.status === 'PAID').length), color: 'text-green-600' },
                  { label: 'Total pago', value: formatCurrency(allPayments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)), color: 'text-mastchieve-700' },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className={cn('text-sm font-bold', s.color)}>{s.value}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Year rows */}
              {years.map((y) => (
                <YearHistoryRow
                  key={y}
                  year={y}
                  payments={byYear.get(y) ?? []}
                  isSelected={selectedYear === y}
                  onClick={() => { setSelectedYear(y); setShowHistory(false); setStatusFilter(''); }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Year navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={goPrevYear}
          disabled={selectedYearIdx >= years.length - 1}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => { setSelectedYear(y); setStatusFilter(''); }}
              className={cn(
                'text-xs font-bold px-3 py-1.5 rounded-full border transition flex-shrink-0',
                selectedYear === y
                  ? 'bg-mastchieve-600 text-white border-mastchieve-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-mastchieve-300',
              )}
            >
              {y}
            </button>
          ))}
        </div>

        <button
          onClick={goNextYear}
          disabled={selectedYearIdx <= 0}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="text-xs text-gray-400 flex-shrink-0">{filtered.length} reg.</div>
      </div>

      {/* Annual calendar grid */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-mastchieve-500" />
          <span className="text-sm font-bold text-gray-900">Calendário {selectedYear}</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const key = `${selectedYear}-${String(month).padStart(2, '0')}`;
            const payment = calendarMap[key];
            const isFuture = selectedYear > new Date().getFullYear() || (selectedYear === new Date().getFullYear() && month > currentMonth);
            const status = payment?.status;
            const cfg = status ? STATUS_CFG[status] : null;

            return (
              <div
                key={i}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition',
                  !payment && !isFuture ? 'border-dashed border-gray-200 bg-gray-50/50' : '',
                  payment && cfg ? `${cfg.bg} ${cfg.border}` : '',
                  isFuture && !payment ? 'border-gray-100 bg-gray-50/30' : '',
                  month === currentMonth && selectedYear === new Date().getFullYear() && !payment ? 'border-mastchieve-200 bg-mastchieve-50/30' : '',
                )}
              >
                <div className={cn(
                  'w-3 h-3 rounded-full flex-shrink-0',
                  status === 'PAID' ? 'bg-green-500' :
                  status === 'PENDING' ? 'bg-amber-400' :
                  status === 'OVERDUE' ? 'bg-red-500' :
                  isFuture ? 'bg-gray-200' :
                  month === currentMonth && selectedYear === new Date().getFullYear() ? 'bg-mastchieve-400' :
                  'bg-gray-200',
                )} />
                <span className={cn(
                  'text-[9px] font-bold',
                  status === 'PAID' ? 'text-green-700' :
                  status === 'PENDING' ? 'text-amber-700' :
                  status === 'OVERDUE' ? 'text-red-700' :
                  'text-gray-400',
                )}>
                  {MONTHS_PT[i]}
                </span>
                {payment && (
                  <span className="text-[8px] text-gray-500 font-semibold">
                    {formatCurrency(payment.amount)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-50">
          {[
            { color: 'bg-green-500', label: 'Pago' },
            { color: 'bg-amber-400', label: 'Pendente' },
            { color: 'bg-red-500',   label: 'Em atraso' },
            { color: 'bg-gray-200',  label: 'Sem registo' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={cn('w-2.5 h-2.5 rounded-full', l.color)} />
              <span className="text-[10px] text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: '', label: 'Todos' }, ...Object.entries(STATUS_CFG).map(([k, v]) => ({ value: k, label: v.label }))].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full font-medium border transition',
              statusFilter === f.value
                ? 'bg-mastchieve-600 text-white border-mastchieve-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-mastchieve-300',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Payment list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-mastchieve-500" />
            <span className="font-bold text-sm text-gray-900">Histórico</span>
          </div>
          <span className="text-xs text-gray-400">{filtered.length} pagamento{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-12" />
                  <div className="h-3 bg-gray-100 rounded w-10" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sem pagamentos para o período seleccionado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((p: any) => (
              <PaymentRow key={p.id} payment={p} onViewReceipt={setReceiptPayment} />
            ))}
          </div>
        )}

        {/* Year summary footer */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Total {selectedYear}</span>
            <div className="flex items-center gap-4">
              <span className="text-green-600 font-semibold">
                Pago: {formatCurrency(filtered.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0))}
              </span>
              {filtered.some((p) => p.status !== 'PAID') && (
                <span className="text-amber-600 font-semibold">
                  Pendente: {formatCurrency(filtered.filter((p) => p.status !== 'PAID').reduce((s, p) => s + p.amount, 0))}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Receipt modal */}
      {receiptPayment && (
        <ReceiptModal payment={receiptPayment} onClose={() => setReceiptPayment(null)} />
      )}
    </div>
  );
}
