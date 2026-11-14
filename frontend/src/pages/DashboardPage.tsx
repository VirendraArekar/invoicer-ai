import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { dashboardApi } from '../services/api';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardApi.getSummary(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading live financial metrics...</p>
        </div>
      </div>
    );
  }

  const metrics = summary?.metrics;
  const aiPulse = summary?.aiPulse;
  const recentInvoices = summary?.recentInvoices || [];
  const recentPayments = summary?.recentPayments || [];
  const monthlyTrends = summary?.monthlyTrends || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Welcome back, {user?.name || 'Alex'}</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {user?.companyName || 'Nexus Cloud Technologies'} · Real-time financial overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/ai-assistant"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 animate-pulse" />
            <span>AI Copilot</span>
          </Link>
          <Link
            to="/invoices/new"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Link>
        </div>
      </div>

      {/* --- 4 CORE METRIC CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Collected Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-brand-500/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Revenue Collected</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            {formatCurrency(metrics?.totalRevenue, user?.currency)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{metrics?.invoices.paid || 0} invoices paid in full</span>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-brand-500/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Outstanding Receivables</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            {formatCurrency(metrics?.outstandingBalance, user?.currency)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{metrics?.invoices.pending || 0} active pending invoices</span>
          </div>
        </div>

        {/* Overdue Balance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-brand-500/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue Amount</span>
            <div className={`p-2 rounded-xl ${metrics?.overdueAmount ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-extrabold font-mono tracking-tight ${metrics?.overdueAmount ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
            {formatCurrency(metrics?.overdueAmount, user?.currency)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={metrics?.overdueAmount ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}>
              {metrics?.invoices.overdue || 0} overdue accounts
            </span>
            {metrics?.overdueAmount ? (
              <Link to="/ai-assistant" className="text-brand-600 dark:text-brand-400 hover:underline font-semibold flex items-center gap-1">
                <span>AI Recall</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            ) : null}
          </div>
        </div>

        {/* Net Profit & Margin */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-brand-500/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Operating Profit</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            {formatCurrency(metrics?.netProfit, user?.currency)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
            <span>{metrics?.profitMargin || 0}% operating margin</span>
          </div>
        </div>
      </div>

      {/* --- AI BUSINESS PULSE WIDGET --- */}
      {aiPulse && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-50 via-white to-indigo-50/60 dark:from-slate-900 dark:via-brand-950/40 dark:to-slate-900 border border-brand-200 dark:border-brand-500/30 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-brand-600/10 dark:bg-brand-600/20 border border-brand-500/30 dark:border-brand-500/40 text-brand-600 dark:text-brand-300 shrink-0">
                <span className="text-xl font-extrabold font-mono">{aiPulse.healthScore}</span>
                <span className="text-[9px] uppercase tracking-wider text-brand-600 dark:text-brand-400 font-bold">Health</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300">
                    {aiPulse.status}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Estimated Runway: <strong className="text-slate-900 dark:text-white">{aiPulse.runwayMonths} months</strong>
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{aiPulse.summary}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 shrink-0 animate-pulse" />
                  <span><strong>AI Strategy:</strong> {aiPulse.recommendation}</span>
                </p>
              </div>
            </div>

            <Link
              to="/ai-assistant"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30 shrink-0 flex items-center gap-2 hover:-translate-y-0.5"
            >
              <span>Explore AI Advisory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* --- REVENUE VS EXPENSES CHART --- */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Monthly Cash Flow Dynamics</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Revenue collections vs operational expenditures</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
              Revenue
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Expenses
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
              <XAxis dataKey="month" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `$${val / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
              />
              <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={36} />
              <Bar dataKey="expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- BOTTOM SECTION: RECENT INVOICES & PAYMENTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Invoices (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Invoices</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Latest billing activity</p>
              </div>
              <Link
                to="/invoices"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1"
              >
                <span>View All Invoices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentInvoices.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No invoices generated yet.</div>
              ) : (
                recentInvoices.map((inv) => {
                  const badge = getStatusBadge(inv.status);
                  return (
                    <div key={inv.id} className="py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors">
                      <div className="min-w-0">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="text-xs font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate block"
                        >
                          {inv.invoice_number} · {inv.client_name}
                        </Link>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Issued {formatDate(inv.issue_date)} · Due {formatDate(inv.due_date)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white text-right">
                          {formatCurrency(inv.total_amount, inv.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4">
            <Link
              to="/invoices/new"
              className="flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Invoice</span>
            </Link>
          </div>
        </div>

        {/* Recent Payments Stream (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Payment Receipts</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Incoming settlement transactions</p>
              </div>
              <Link
                to="/payments"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1"
              >
                <span>All Payments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentPayments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No payment receipts logged yet.</div>
              ) : (
                recentPayments.map((pay) => (
                  <div key={pay.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {pay.client_name || 'Payment'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {pay.payment_method} · {formatDate(pay.payment_date)}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(pay.amount, pay.currency)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4">
            <Link
              to="/payments"
              className="flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <span>Record Incoming Payment</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
