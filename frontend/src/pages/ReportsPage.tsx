import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  TrendingUp,
  Receipt,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { reportsApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pl' | 'tax' | 'aging'>('pl');

  const { data: plData } = useQuery({
    queryKey: ['report-pl'],
    queryFn: () => reportsApi.getProfitLoss(),
  });

  const { data: taxData } = useQuery({
    queryKey: ['report-tax'],
    queryFn: () => reportsApi.getTaxSummary(),
  });

  const { data: agingData } = useQuery({
    queryKey: ['report-aging'],
    queryFn: () => reportsApi.getAgingAr(),
  });

  const colors = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Financial Reports & Analytics</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit cash flow, evaluate P&L, reconcile tax obligations, and export spreadsheets
          </p>
        </div>

        {/* 1-Click CSV Export Action Buttons */}
        <div className="flex items-center gap-2.5">
          <a
            href={reportsApi.invoicesCsvUrl}
            target="_blank"
            rel="noreferrer"
            download
            onClick={() => toast.info('Exporting Invoices CSV spreadsheet...', 'CSV Export')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-brand-500" />
            <span>Export Invoices CSV</span>
          </a>

          <a
            href={reportsApi.expensesCsvUrl}
            target="_blank"
            rel="noreferrer"
            download
            onClick={() => toast.info('Exporting Expenses CSV spreadsheet...', 'CSV Export')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-rose-500" />
            <span>Export Expenses CSV</span>
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('pl')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'pl'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Profit & Loss Statement</span>
        </button>

        <button
          onClick={() => setActiveTab('tax')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'tax'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Tax & Deduction Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('aging')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'aging'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>A/R Aging Analysis</span>
        </button>
      </div>

      {/* --- TAB 1: PROFIT & LOSS --- */}
      {activeTab === 'pl' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Revenue Collected</span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mt-1">
                {formatCurrency(plData?.totalIncome, user?.currency)}
              </p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">Gross paid client settlements</span>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Expenses</span>
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tracking-tight mt-1">
                {formatCurrency(plData?.totalExpenses, user?.currency)}
              </p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">Operating costs and vendor payments</span>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Operating Profit</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-1">
                {formatCurrency(plData?.netProfit, user?.currency)}
              </p>
              <span className="text-[11px] text-brand-600 dark:text-brand-400 font-bold block mt-1">
                {plData?.margin || 0}% Operating Margin
              </span>
            </div>
          </div>

          {/* Expenses Breakdown Bar Chart */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Expense Distribution by Category</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Where capital was deployed this period</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={plData?.expensesByCategory || []}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} horizontal={false} />
                  <XAxis
                    type="number"
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    fontSize={11}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    fontSize={11}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Amount']}
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                    {(plData?.expensesByCategory || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: TAX SUMMARY --- */}
      {activeTab === 'tax' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tax Collected on Sales</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-1">
                {formatCurrency(taxData?.taxCollected, user?.currency)}
              </p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">From invoiced deliverables</span>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tax Paid on Business Expenses</span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mt-1">
                {formatCurrency(taxData?.taxPaidOnExpenses, user?.currency)}
              </p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">Input tax credit eligible</span>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Estimated Tax Liability</span>
              <p className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 font-mono tracking-tight mt-1">
                {formatCurrency(taxData?.netTaxOwed, user?.currency)}
              </p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">Estimated remittance balance</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Deductions Audit Summary</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              <div className="py-3 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Gross Taxable Revenue Base:</span>
                <span className="font-mono text-slate-900 dark:text-white font-semibold">
                  {formatCurrency(taxData?.taxableSales, user?.currency)}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Tax Deductible Expenses:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {formatCurrency(taxData?.deductibleExpenses, user?.currency)}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Estimated Tax Savings from Deductions:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatCurrency((Number(taxData?.deductibleExpenses || 0) * 0.25), user?.currency)} (est. 25% bracket)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: AGING ACCOUNTS RECEIVABLE --- */}
      {activeTab === 'aging' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Current (Not Due)</span>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                {formatCurrency(agingData?.buckets?.current, user?.currency)}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-medium">1–30 Days Past</span>
              <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-1">
                {formatCurrency(agingData?.buckets?.days1To30, user?.currency)}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] text-orange-600 dark:text-orange-400 block font-medium">31–60 Days Past</span>
              <p className="text-lg font-extrabold text-orange-600 dark:text-orange-400 font-mono mt-1">
                {formatCurrency(agingData?.buckets?.days31To60, user?.currency)}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] text-rose-600 dark:text-rose-400 block font-medium">61–90 Days Past</span>
              <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-1">
                {formatCurrency(agingData?.buckets?.days61To90, user?.currency)}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] text-rose-700 dark:text-rose-500 block font-bold">90+ Days Past</span>
              <p className="text-lg font-extrabold text-rose-700 dark:text-rose-500 font-mono mt-1">
                {formatCurrency(agingData?.buckets?.days90Plus, user?.currency)}
              </p>
            </div>
          </div>

          {/* Overdue Accounts Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Itemized Overdue Invoices</h3>
            {agingData?.itemizedOverdue?.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero overdue accounts! All client receivables are current.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Days Overdue</th>
                      <th className="py-3 px-4">Aging Bracket</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {(agingData?.itemizedOverdue || []).map((inv: any) => (
                      <tr key={inv.id}>
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{inv.client_name}</td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{formatDate(inv.due_date)}</td>
                        <td className="py-3.5 px-4 font-mono text-rose-600 dark:text-rose-400 font-bold">
                          {inv.overdue_days} days
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                            {inv.bucket}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(inv.balance_due, inv.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
