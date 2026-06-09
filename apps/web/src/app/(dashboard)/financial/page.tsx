'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import {
  CreditCard, AlertCircle, CheckCircle, Clock, TrendingUp, Plus,
  X, FileDown, Bell, ChevronDown,
} from 'lucide-react';

/* ─────────────────── Constants ─────────────────── */

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Numerário' },
  { value: 'TRANSFER', label: 'Transferência' },
  { value: 'CARD', label: 'Cartão' },
  { value: 'MB_WAY', label: 'MB Way' },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PAID: { label: 'Pago', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  OVERDUE: { label: 'Em atraso', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-600', icon: null },
};

/* ─────────────────── Sub-components ─────────────────── */

function GradientCard({
  title, value, sub, gradientFrom, gradientTo, icon: Icon, iconBg, badge,
}: {
  title: string;
  value: string | number;
  sub?: string;
  gradientFrom: string;
  gradientTo: string;
  icon: any;
  iconBg: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-xl p-5 text-white shadow-sm', `bg-gradient-to-br ${gradientFrom} ${gradientTo}`)}>
      <div className="flex items-start justify-between gap-2">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {badge && <div className="text-xs font-semibold opacity-90">{badge}</div>}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold leading-tight">{value}</div>
        <div className="text-xs font-medium mt-0.5 opacity-80">{title}</div>
        {sub && <div className="text-xs opacity-70 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

/* ─────────────────── Generate Modal ─────────────────── */

interface GenerateModalProps {
  onClose: () => void;
  onConfirm: (opts: { month: number; year: number; amount: number; allActive: boolean }) => void;
  isPending: boolean;
}

function GenerateModal({ onClose, onConfirm, isPending }: GenerateModalProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [amount, setAmount] = useState(45);
  const [allActive, setAllActive] = useState(true);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Gerar Mensalidades</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Mês</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mastchieve-500"
              >
                {MONTH_LABELS.map((label, i) => (
                  <option key={i + 1} value={i + 1}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Ano</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mastchieve-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Valor (€)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={0}
              step={0.5}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mastchieve-500"
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allActive}
              onChange={(e) => setAllActive(e.target.checked)}
              className="w-4 h-4 rounded accent-mastchieve-600"
            />
            <span className="text-sm text-gray-700">Gerar para todos os atletas ativos</span>
          </label>
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm({ month, year, amount, allActive })}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium bg-mastchieve-600 hover:bg-mastchieve-700 text-white rounded-lg transition disabled:opacity-60"
          >
            {isPending ? 'A gerar...' : 'Gerar Mensalidades'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Main Page ─────────────────── */

export default function FinancialPage() {
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [year, setYear] = useState(currentYear);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});

  /* ── Queries ── */
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20', ...(statusFilter && { status: statusFilter }) });
      const { data } = await api.get(`/financial/payments?${params}`);
      return data;
    },
  });

  const { data: summary } = useQuery({
    queryKey: ['financial-summary', year],
    queryFn: async () => {
      const { data } = await api.get(`/financial/summary?year=${year}`);
      return data.data ?? data;
    },
  });

  /* ── Mutations ── */
  const payMutation = useMutation({
    mutationFn: ({ id, method }: { id: string; method: string }) =>
      api.patch(`/financial/payments/${id}/pay`, { method }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });

  const generateMutation = useMutation({
    mutationFn: (opts: { month: number; year: number; amount: number; allActive: boolean }) =>
      api.post('/financial/monthly-fees/generate', opts),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['financial-summary'] });
      setShowGenerateModal(false);
      toast.success('Mensalidades geradas com sucesso');
    },
    onError: () => toast.error('Erro ao gerar mensalidades'),
  });

  const remindersMutation = useMutation({
    mutationFn: () => api.post('/financial/send-reminders', {}),
    onSuccess: () => toast.success('Lembretes enviados com sucesso'),
    onError: () => toast.info('Funcionalidade em desenvolvimento'),
  });

  /* ── Derived data ── */
  const rawMonthly: { month: number; paid: number; pending: number }[] = summary?.monthlyData ?? [];
  const chartData = MONTH_LABELS.map((label, i) => {
    const found = rawMonthly.find((m) => m.month === i + 1);
    return { name: label, Pago: found?.paid ?? 0, Pendente: found?.pending ?? 0 };
  });

  const overdueCount: number = summary?.overduePayments ?? 0;
  const thisMonthPaid = rawMonthly.find((m) => m.month === new Date().getMonth() + 1)?.paid ?? 0;

  /* ── Export PDF ── */
  const handleExportPdf = async () => {
    try {
      const response = await api.get(`/financial/export?year=${year}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financeiro-${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.info('Funcionalidade em desenvolvimento');
    }
  };

  /* ── Year options ── */
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de pagamentos e mensalidades</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Year selector */}
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="appearance-none text-sm border border-gray-200 bg-white rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-mastchieve-500 cursor-pointer"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>

          {/* Export PDF */}
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </button>

          {/* Generate modal trigger */}
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Gerar Mensalidades
          </button>
        </div>
      </div>

      {/* ── Generate Modal ── */}
      {showGenerateModal && (
        <GenerateModal
          onClose={() => setShowGenerateModal(false)}
          onConfirm={(opts) => generateMutation.mutate(opts)}
          isPending={generateMutation.isPending}
        />
      )}

      {/* ── Bulk action bar ── */}
      {overdueCount > 0 && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{overdueCount} pagamento{overdueCount !== 1 ? 's' : ''} em atraso</span>
          </div>
          <button
            onClick={() => remindersMutation.mutate()}
            disabled={remindersMutation.isPending}
            className="flex items-center gap-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-60"
          >
            <Bell className="w-3.5 h-3.5" />
            {remindersMutation.isPending ? 'A enviar...' : 'Enviar lembretes'}
          </button>
        </div>
      )}

      {/* ── Summary Cards (4 gradient) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <GradientCard
          title={`Receita Total ${year}`}
          value={formatCurrency(summary?.totalRevenue ?? 0)}
          gradientFrom="from-green-500"
          gradientTo="to-emerald-600"
          icon={TrendingUp}
          iconBg="bg-white/20"
        />
        <GradientCard
          title="Pendente"
          value={formatCurrency(summary?.pendingAmount ?? 0)}
          sub={`${summary?.pendingCount ?? 0} pagamentos pendentes`}
          gradientFrom="from-amber-400"
          gradientTo="to-orange-500"
          icon={Clock}
          iconBg="bg-white/20"
        />
        <GradientCard
          title="Em Atraso"
          value={overdueCount}
          sub={overdueCount > 0 ? 'Requer atenção urgente' : 'Sem atrasos'}
          gradientFrom="from-red-500"
          gradientTo="to-rose-600"
          icon={AlertCircle}
          iconBg="bg-white/20"
          badge={overdueCount > 0 ? '⚠ Urgente' : undefined}
        />
        <GradientCard
          title="Cobrado este mês"
          value={formatCurrency(thisMonthPaid)}
          gradientFrom="from-blue-500"
          gradientTo="to-indigo-600"
          icon={CreditCard}
          iconBg="bg-white/20"
        />
      </div>

      {/* ── Area Chart ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Evolução mensal de receita — {year}</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPago" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradPendente" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `${v}€`}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={(val: any) => formatCurrency(Number(val))}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Area
              type="monotone"
              dataKey="Pago"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#gradPago)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="Pendente"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#gradPendente)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mastchieve-500"
        >
          <option value="">Todos os estados</option>
          {Object.entries(statusConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{payments?.meta?.total ?? 0} registos</span>
      </div>

      {/* ── Payments Table ── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Atleta</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Valor</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Vencimento</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Estado</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Recibo</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              : payments?.data?.map((p: any) => {
                  const cfg = statusConfig[p.status];
                  const Icon = cfg?.icon;
                  const selectedMethod = paymentMethods[p.id] ?? 'CASH';
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {p.student?.firstName} {p.student?.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(p.dueDate)}</td>
                      <td className="px-6 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium', cfg?.color)}>
                          {Icon && <Icon className="w-3 h-3" />}
                          {cfg?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">{p.receiptNumber || '—'}</td>
                      <td className="px-6 py-4">
                        {p.status !== 'PAID' && (
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedMethod}
                              onChange={(e) =>
                                setPaymentMethods((prev) => ({ ...prev, [p.id]: e.target.value }))
                              }
                              className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-mastchieve-500 bg-white"
                            >
                              {PAYMENT_METHODS.map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => payMutation.mutate({ id: p.id, method: selectedMethod })}
                              disabled={payMutation.isPending}
                              className="text-xs text-mastchieve-600 hover:bg-mastchieve-50 px-2.5 py-1.5 rounded-lg transition font-medium disabled:opacity-60"
                            >
                              Marcar Pago
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>

        {/* Pagination */}
        {payments?.meta && payments.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-40 font-medium"
            >
              ← Anterior
            </button>
            <span className="text-xs text-gray-500">
              Página {page} de {payments.meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(payments.meta.totalPages, p + 1))}
              disabled={page === payments.meta.totalPages}
              className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-40 font-medium"
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
