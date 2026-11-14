import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Plus,
  Search,
  Sparkles,
  DollarSign,
  Trash2,
  X,
  FileText,
} from 'lucide-react';
import { expensesApi, aiApi, clientsApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Form State
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('Software & Cloud');
  const [amount, setAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [isTaxDeductible, setIsTaxDeductible] = useState(true);
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // AI OCR Parse State
  const [ocrText, setOcrText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', categoryFilter, searchTerm],
    queryFn: () => expensesApi.getAll({ category: categoryFilter, search: searchTerm }),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let receiptUrl = '';
      if (receiptFile) {
        const uploadRes = await expensesApi.uploadReceipt(receiptFile);
        receiptUrl = uploadRes.url;
      }
      return expensesApi.create({
        vendor,
        category,
        amount: Number(amount),
        taxAmount: Number(taxAmount),
        isTaxDeductible,
        expenseDate,
        description,
        clientId: clientId || undefined,
        receiptUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setShowModal(false);
      resetForm();
      toast.success(`Expense of ${formatCurrency(amount, user?.currency)} saved to tax ledger.`, 'Expense Saved');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save expense.', 'Expense Error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Expense item deleted.', 'Expense Removed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete expense.', 'Delete Error');
    },
  });

  const resetForm = () => {
    setVendor('');
    setCategory('Software & Cloud');
    setAmount(0);
    setTaxAmount(0);
    setIsTaxDeductible(true);
    setExpenseDate(new Date().toISOString().substring(0, 10));
    setDescription('');
    setClientId('');
    setReceiptFile(null);
  };

  const handleRunAiReceiptParser = async () => {
    if (!ocrText.trim()) return;
    setAiLoading(true);
    try {
      const parsed = await aiApi.parseReceipt(ocrText);
      if (parsed.vendor) setVendor(parsed.vendor);
      if (parsed.totalAmount) setAmount(Number(parsed.totalAmount));
      if (parsed.taxAmount) setTaxAmount(Number(parsed.taxAmount));
      if (parsed.category) setCategory(parsed.category);
      if (parsed.date) setExpenseDate(parsed.date.substring(0, 10));
      if (parsed.isDeductible !== undefined) setIsTaxDeductible(Boolean(parsed.isDeductible));
      if (parsed.description) setDescription(parsed.description);

      setShowAiModal(false);
      setOcrText('');
      setShowModal(true);
      toast.success('Gemini AI extracted vendor, total & tax data from receipt!', 'Receipt Extracted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to parse receipt with AI.', 'OCR Error');
    } finally {
      setAiLoading(false);
    }
  };

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalDeductible = expenses
    .filter((e) => e.is_tax_deductible)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const categories = [
    'all',
    'Software & Cloud',
    'Office & Workspace',
    'Hardware & Gear',
    'Contractor & Labor',
    'Travel & Meals',
    'Marketing & Ads',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Expense Tracking</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Capture operational costs, upload receipts, and reconcile tax deductions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30 rounded-xl transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
            <span>AI Receipt OCR</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Operating Expenses</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {formatCurrency(totalSpent, user?.currency)}
            </p>
            <span className="text-xs text-slate-500 dark:text-slate-400">{expenses.length} receipts logged</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tax Deductible Portion</span>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {formatCurrency(totalDeductible, user?.currency)}
            </p>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Eligible business deductions</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Deductibility Efficiency</span>
            <p className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 font-mono mt-0.5">
              {totalSpent > 0 ? Math.round((totalDeductible / totalSpent) * 100) : 100}%
            </p>
            <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">Write-off optimization</span>
          </div>
          <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                categoryFilter === cat ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Expenses' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No expenses recorded yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add operating receipts to track tax write-offs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Vendor</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6">Tax Deductible</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400">{formatDate(e.expense_date)}</td>
                    <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{e.vendor}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 max-w-xs truncate">{e.description || '—'}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          e.is_tax_deductible
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {e.is_tax_deductible ? 'Deductible' : 'Standard'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-rose-600 dark:text-rose-400">
                      -{formatCurrency(e.amount, user?.currency)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete expense from ${e.vendor}?`)) {
                            deleteMutation.mutate(e.id);
                          }
                        }}
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

      {/* --- ADD EXPENSE MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-500" />
                <span>Add Business Expense</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
              className="space-y-4 mt-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vendor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g. Amazon Web Services or WeWork"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Software & Cloud">Software & Cloud</option>
                    <option value="Office & Workspace">Office & Workspace</option>
                    <option value="Hardware & Gear">Hardware & Gear</option>
                    <option value="Contractor & Labor">Contractor & Labor</option>
                    <option value="Travel & Meals">Travel & Meals</option>
                    <option value="Marketing & Ads">Marketing & Ads</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tax Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Attach Receipt File (Multer)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setReceiptFile(e.target.files[0]);
                      toast.info(`Selected file "${e.target.files[0].name}" for upload.`, 'Receipt Attached');
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 dark:hover:file:bg-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description / Project Scope</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes or business purpose..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="deductibleCheck"
                  checked={isTaxDeductible}
                  onChange={(e) => setIsTaxDeductible(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-800 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="deductibleCheck" className="text-xs text-slate-700 dark:text-slate-300 select-none">
                  Tax deductible business expense
                </label>
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
                  disabled={saveMutation.isPending || !vendor || amount <= 0}
                  className="px-4 py-2 font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30 disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- AI RECEIPT OCR PARSER MODAL --- */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5 text-brand-600 dark:text-brand-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Receipt OCR Data Extractor</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Paste raw invoice / receipt text or transcript. Gemini AI will automatically extract the vendor,
              amount, tax portion, category, and date into your ledger.
            </p>

            <textarea
              rows={5}
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              placeholder="e.g. AWS Invoice #88912 Date: Nov 10, 2026. EC2 & S3 Compute Total: $480.00, Tax: $39.60"
              className="w-full p-3.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={aiLoading || !ocrText.trim()}
                onClick={handleRunAiReceiptParser}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiLoading ? 'Extracting with Gemini...' : 'Extract & Fill Expense'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
