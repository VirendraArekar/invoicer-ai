import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Download,
  Send,
  CreditCard,
  Copy,
  Trash2,
  Sparkles,
  AlertCircle,
  Edit,
  Plus,
  X,
} from 'lucide-react';
import { invoicesApi, paymentsApi, aiApi, settingsApi } from '../services/api';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  // Record Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer (ACH)');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // AI Reminder Drawer State
  const [showReminderDrawer, setShowReminderDrawer] = useState(false);
  const [reminderTone, setReminderTone] = useState<'polite' | 'firm' | 'urgent'>('firm');
  const [reminderLoading, setReminderLoading] = useState(false);
  const [draftedReminder, setDraftedReminder] = useState<any>(null);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.getOne(id!),
    enabled: Boolean(id),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  });

  // Record Payment Mutation
  const recordPaymentMutation = useMutation({
    mutationFn: () =>
      paymentsApi.record({
        invoiceId: id!,
        amount: Number(paymentAmount),
        paymentDate,
        paymentMethod,
        transactionReference: paymentRef,
        notes: paymentNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setShowPaymentModal(false);
      toast.success(
        `Payment of ${formatCurrency(paymentAmount, invoice?.currency)} recorded! Balance updated.`,
        'Payment Settled',
      );
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record payment.', 'Payment Error');
    },
  });

  // Send Email Mutation
  const sendEmailMutation = useMutation({
    mutationFn: () => invoicesApi.sendEmail(id!),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(res.message || 'Invoice dispatched to client email!', 'Email Sent');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to dispatch email.', 'Email Error');
    },
  });

  // Duplicate Mutation
  const duplicateMutation = useMutation({
    mutationFn: () => invoicesApi.duplicate(id!),
    onSuccess: (res: any) => {
      toast.success('Cloned invoice created.', 'Invoice Duplicated');
      navigate(`/invoices/${res.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to duplicate invoice.', 'Duplication Error');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: () => invoicesApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted from system.', 'Invoice Removed');
      navigate('/invoices');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete invoice.', 'Delete Error');
    },
  });

  const handleGenerateAiReminder = async (tone = reminderTone) => {
    if (!invoice) return;
    setReminderLoading(true);
    try {
      const res = await aiApi.draftReminder({
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.client_name,
        amountDue: Number(invoice.balance_due),
        daysOverdue: 7,
        tone,
      });
      setDraftedReminder(res);
      toast.success(`Drafted ${tone} late-payment reminder with Gemini AI`, 'AI Reminder Drafted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to draft AI reminder', 'AI Error');
    } finally {
      setReminderLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading invoice document...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Invoice Not Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">The requested invoice ID does not exist.</p>
        <Link
          to="/invoices"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>
      </div>
    );
  }

  const badge = getStatusBadge(invoice.status);
  const isOverdue = invoice.status === 'overdue' || Number(invoice.balance_due) > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                {invoice.invoice_number}
              </h1>
              <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Issued to <strong className="text-slate-900 dark:text-white">{invoice.client_name}</strong> on {formatDate(invoice.issue_date)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* AI Follow-Up Reminder */}
          {Number(invoice.balance_due) > 0 && (
            <button
              onClick={() => {
                setShowReminderDrawer(true);
                handleGenerateAiReminder(reminderTone);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30 rounded-xl transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
              <span>AI Late Reminder</span>
            </button>
          )}

          {/* Record Payment Button */}
          {Number(invoice.balance_due) > 0 && (
            <button
              onClick={() => {
                setPaymentAmount(Number(invoice.balance_due));
                setShowPaymentModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-sm hover:-translate-y-0.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          )}

          {/* Send Email */}
          <button
            onClick={() => sendEmailMutation.mutate()}
            disabled={sendEmailMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Email</span>
          </button>

          {/* Download PDF */}
          <a
            href={invoicesApi.downloadPdfUrl(invoice.id)}
            target="_blank"
            rel="noreferrer"
            onClick={() => toast.info(`Generating official PDF for ${invoice.invoice_number}...`, 'PDF Download')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30 hover:-translate-y-0.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </a>

          {/* Edit */}
          <Link
            to={`/invoices/${invoice.id}/edit`}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title="Edit Invoice"
          >
            <Edit className="w-4 h-4" />
          </Link>

          {/* Duplicate */}
          <button
            onClick={() => duplicateMutation.mutate()}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title="Clone / Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (confirm('Delete this invoice permanently?')) {
                deleteMutation.mutate();
              }
            }}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title="Delete Invoice"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overdue Alert Banner */}
      {isOverdue && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">This invoice is past due</p>
              <p className="text-[11px] text-rose-600 dark:text-rose-300">
                Payment was expected by {formatDate(invoice.due_date)}. Balance remaining:{' '}
                <strong>{formatCurrency(invoice.balance_due, invoice.currency)}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowReminderDrawer(true);
              handleGenerateAiReminder('firm');
            }}
            className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-sm hover:-translate-y-0.5"
          >
            Generate Follow-up
          </button>
        </div>
      )}

      {/* --- RENDERED HIGH-RESOLUTION INVOICE DOCUMENT --- */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              Tax Invoice
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {settings?.company_name || user?.companyName || 'Invoicer AI Business'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{settings?.email || user?.email}</p>
            {settings?.phone && <p className="text-xs text-slate-500 dark:text-slate-400">{settings.phone}</p>}
            {settings?.tax_id && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">Tax ID / VAT: {settings.tax_id}</p>
            )}
          </div>

          <div className="text-left sm:text-right">
            <p className="text-3xl font-black text-brand-600 dark:text-brand-400 font-mono tracking-tight">
              {formatCurrency(invoice.total_amount, invoice.currency)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Balance Due:{' '}
              <strong className={Number(invoice.balance_due) > 0 ? 'text-rose-600 dark:text-rose-400 font-mono' : 'text-emerald-600 dark:text-emerald-400 font-mono'}>
                {formatCurrency(invoice.balance_due, invoice.currency)}
              </strong>
            </p>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
              <p>Issue Date: <strong className="text-slate-900 dark:text-white">{formatDate(invoice.issue_date)}</strong></p>
              <p>Due Date: <strong className="text-slate-900 dark:text-white">{formatDate(invoice.due_date)}</strong></p>
            </div>
          </div>
        </div>

        {/* Client Billing Info */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Billed To</span>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{invoice.client_name}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">{invoice.client_email}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">{invoice.client_phone}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">{invoice.client_address}</p>
          {invoice.client_tax_number && (
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1">Client Tax ID: {invoice.client_tax_number}</p>
          )}
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Tax %</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {(invoice.items || []).map((itm: any) => (
                <tr key={itm.id}>
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">{itm.description}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">{itm.quantity}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                    {formatCurrency(itm.unit_price, invoice.currency)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-400">{itm.tax_rate}%</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(itm.total, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-900 dark:text-white font-semibold">
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </span>
            </div>

            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount:</span>
                <span className="font-mono font-semibold">
                  -{formatCurrency(invoice.discount_amount, invoice.currency)}
                </span>
              </div>
            )}

            {Number(invoice.tax_amount) > 0 && (
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Tax ({invoice.tax_rate}%):</span>
                <span className="font-mono text-slate-900 dark:text-white font-semibold">
                  {formatCurrency(invoice.tax_amount, invoice.currency)}
                </span>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white">
              <span>Total:</span>
              <span className="font-mono text-brand-600 dark:text-brand-400 font-extrabold">
                {formatCurrency(invoice.total_amount, invoice.currency)}
              </span>
            </div>

            {Number(invoice.amount_paid) > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 pt-1 text-xs">
                <span>Amount Paid:</span>
                <span className="font-mono font-semibold">
                  {formatCurrency(invoice.amount_paid, invoice.currency)}
                </span>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-extrabold">
              <span className="text-slate-700 dark:text-slate-300">Balance Due:</span>
              <span className={Number(invoice.balance_due) > 0 ? 'text-rose-600 dark:text-rose-400 font-mono' : 'text-emerald-600 dark:text-emerald-400 font-mono'}>
                {formatCurrency(invoice.balance_due, invoice.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Notes */}
        {(invoice.terms || invoice.notes) && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            {invoice.terms && (
              <p>
                <strong className="text-slate-800 dark:text-slate-300">Payment Terms:</strong> {invoice.terms}
              </p>
            )}
            {invoice.notes && (
              <p>
                <strong className="text-slate-800 dark:text-slate-300">Notes & Instructions:</strong> {invoice.notes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* --- PAYMENT TRANSACTIONS SECTION --- */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Payment Ledger for this Invoice</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Reconciled deposits and customer wire transfers</p>
          </div>
          {Number(invoice.balance_due) > 0 && (
            <button
              onClick={() => {
                setPaymentAmount(Number(invoice.balance_due));
                setShowPaymentModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          )}
        </div>

        {invoice.payments && invoice.payments.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {invoice.payments.map((p: any) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">{p.payment_method}</span>
                  {p.transaction_reference && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono block">
                      Ref: {p.transaction_reference}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Processed on {formatDate(p.payment_date)}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(p.amount, invoice.currency)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            No payments received for this invoice yet.
          </div>
        )}
      </div>

      {/* --- MODAL: RECORD PAYMENT --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span>Record Invoice Payment</span>
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={Number(invoice.balance_due)}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Bank Transfer (ACH)">Bank Transfer (ACH)</option>
                  <option value="Stripe / Credit Card">Stripe / Credit Card</option>
                  <option value="Wire Transfer">International Wire</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Check">Check</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. ACH-98201 or ch_3Nk..."
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={recordPaymentMutation.isPending || paymentAmount <= 0}
                onClick={() => recordPaymentMutation.mutate()}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/30 disabled:opacity-50"
              >
                {recordPaymentMutation.isPending ? 'Recording...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DRAWER: AI LATE REMINDER DRAFTER --- */}
      {showReminderDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl animate-slide-in-right">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Debt Collection Assistant</h3>
                </div>
                <button
                  onClick={() => setShowReminderDrawer(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">Select Reminder Tone:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['polite', 'firm', 'urgent'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setReminderTone(t);
                          handleGenerateAiReminder(t);
                        }}
                        className={`py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${
                          reminderTone === t
                            ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {reminderLoading ? (
                  <div className="py-12 text-center">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Drafting tailored follow-up with Gemini AI...</p>
                  </div>
                ) : draftedReminder ? (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Subject Line</label>
                      <input
                        type="text"
                        readOnly
                        value={draftedReminder.subject}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Email Body</label>
                      <textarea
                        rows={10}
                        readOnly
                        value={draftedReminder.body}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 leading-relaxed font-sans focus:outline-none"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (draftedReminder) {
                    navigator.clipboard.writeText(
                      `Subject: ${draftedReminder.subject}\n\n${draftedReminder.body}`,
                    );
                    toast.success('Reminder email copied to clipboard!', 'Copied');
                  }
                }}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                type="button"
                onClick={() => {
                  sendEmailMutation.mutate();
                  setShowReminderDrawer(false);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30"
              >
                Simulate Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
