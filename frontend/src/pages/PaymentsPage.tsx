import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Plus,
  DollarSign,
  Trash2,
  X,
  Calendar,
} from 'lucide-react';
import { paymentsApi, invoicesApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer (ACH)');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsApi.getAll(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesApi.getAll(),
  });

  const unpaidInvoices = invoices.filter((i) => Number(i.balance_due) > 0);

  const recordMutation = useMutation({
    mutationFn: () =>
      paymentsApi.record({
        invoiceId,
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        transactionReference: transactionRef,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setShowModal(false);
      toast.success(
        `Payment of ${formatCurrency(amount, user?.currency)} recorded and credited!`,
        'Payment Confirmed',
      );
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record payment.', 'Payment Error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Payment entry removed.', 'Payment Deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete payment.', 'Delete Error');
    },
  });

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Payment Transactions</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track settlements, wire confirmations, and payment receipts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (unpaidInvoices.length > 0) {
                setInvoiceId(unpaidInvoices[0].id);
                setAmount(Number(unpaidInvoices[0].balance_due));
              }
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Metric Callout Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Capital Collected</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
            {formatCurrency(totalCollected, user?.currency)}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {payments.length} verified payment deposits
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <DollarSign className="w-6 h-6" />
        </div>
      </div>

      {/* Payments Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading payment ledger...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-20 text-center px-4">
            <CreditCard className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No payments logged yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
              Record customer wire transfers or card payments against issued invoices.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Payment</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Payment Date</th>
                  <th className="py-3.5 px-6">Client & Invoice #</th>
                  <th className="py-3.5 px-6">Method</th>
                  <th className="py-3.5 px-6">Transaction Ref</th>
                  <th className="py-3.5 px-6">Amount Received</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(p.payment_date)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {p.client_name || 'Client Payment'}
                      </span>
                      {p.invoice_number && (
                        <span className="text-[11px] font-mono text-brand-600 dark:text-brand-400">
                          {p.invoice_number}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{p.payment_method}</td>
                    <td className="py-4 px-6 font-mono text-slate-500 dark:text-slate-400">
                      {p.transaction_reference || 'N/A'}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(p.amount, p.currency || user?.currency)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          if (confirm('Delete this payment transaction?')) {
                            deleteMutation.mutate(p.id);
                          }
                        }}
                        title="Delete"
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- RECORD PAYMENT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span>Record Invoice Payment</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                recordMutation.mutate();
              }}
              className="space-y-4 mt-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Invoice</label>
                <select
                  required
                  value={invoiceId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setInvoiceId(id);
                    const inv = invoices.find((i) => i.id === id);
                    if (inv) setAmount(Number(inv.balance_due));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">Choose an invoice...</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} – {inv.client_name} (Due: ${Number(inv.balance_due).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Bank Transfer (ACH)">Bank Transfer (ACH)</option>
                    <option value="Stripe / Credit Card">Stripe / Credit Card</option>
                    <option value="Wire Transfer">International Wire</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Check">Check</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Ref</label>
                <input
                  type="text"
                  placeholder="e.g. ACH-98201 or ch_3Nk..."
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordMutation.isPending || !invoiceId || amount <= 0}
                  className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/30 disabled:opacity-50"
                >
                  {recordMutation.isPending ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
