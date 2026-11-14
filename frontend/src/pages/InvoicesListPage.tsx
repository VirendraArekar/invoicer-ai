import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  Download,
  Send,
  Copy,
  Trash2,
  Eye,
} from 'lucide-react';
import { invoicesApi } from '../services/api';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const InvoicesListPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', statusFilter, searchTerm],
    queryFn: () => invoicesApi.getAll({ status: statusFilter, search: searchTerm }),
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.sendEmail(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(res.message || 'Invoice sent to client email!', 'Invoice Dispatched');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to send invoice email.', 'Email Error');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Cloned invoice created successfully!', 'Invoice Duplicated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to clone invoice.', 'Duplication Error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice removed from ledger.', 'Invoice Deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete invoice.', 'Delete Error');
    },
  });

  const statusTabs = [
    { key: 'all', label: 'All Invoices' },
    { key: 'draft', label: 'Draft' },
    { key: 'sent', label: 'Sent' },
    { key: 'partial', label: 'Partial' },
    { key: 'paid', label: 'Paid' },
    { key: 'overdue', label: 'Overdue' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Invoices</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, track, and automate payments with AI billing tools
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/invoices/new"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                statusFilter === tab.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice # or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-20 text-center px-4">
            <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No invoices found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters or search keywords.'
                : 'Create your first invoice in seconds using AI assistance or manual entry.'}
            </p>
            <Link
              to="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Invoice #</th>
                  <th className="py-3.5 px-6">Client</th>
                  <th className="py-3.5 px-6">Issue Date</th>
                  <th className="py-3.5 px-6">Due Date</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Balance Due</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {invoices.map((inv) => {
                  const badge = getStatusBadge(inv.status);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5"
                        >
                          <span>{inv.invoice_number}</span>
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-900 dark:text-white">{inv.client_name || 'Client'}</span>
                        {inv.client_email && (
                          <span className="block text-[11px] text-slate-400 dark:text-slate-500">{inv.client_email}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400">{formatDate(inv.issue_date)}</td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400">{formatDate(inv.due_date)}</td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(inv.total_amount, inv.currency)}
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold">
                        <span className={Number(inv.balance_due) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}>
                          {formatCurrency(inv.balance_due, inv.currency)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{badge.label}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/invoices/${inv.id}`}
                            title="View Invoice"
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <a
                            href={invoicesApi.downloadPdfUrl(inv.id)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => toast.info(`Generating PDF for ${inv.invoice_number}...`, 'PDF Download')}
                            title="Download PDF"
                            className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => sendMutation.mutate(inv.id)}
                            title="Send via Email"
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => duplicateMutation.mutate(inv.id)}
                            title="Clone/Duplicate"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete invoice ${inv.invoice_number}?`)) {
                                deleteMutation.mutate(inv.id);
                              }
                            }}
                            title="Delete"
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
