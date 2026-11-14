import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Plus,
  Trash2,
  Save,
  Eye,
  Edit3,
  ArrowLeft,
  X,
} from 'lucide-react';
import { invoicesApi, clientsApi, catalogApi, aiApi, settingsApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const InvoiceCreateEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [polishingIndex, setPolishingIndex] = useState<number | null>(null);

  // Form State
  const [clientId, setClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState(
    () => new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
  );
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [taxRate, setTaxRate] = useState<number>(8.25);
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [notes, setNotes] = useState(
    'Thank you for your business. Please remit payment by the scheduled due date via ACH or credit card.',
  );
  const [terms, setTerms] = useState('Net 30 Days');
  const [items, setItems] = useState<
    Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      productId?: string;
    }>
  >([
    {
      description: 'Senior Cloud Engineering & AI Development',
      quantity: 10,
      unitPrice: 160,
      taxRate: 8.25,
    },
  ]);

  // Load clients and catalog
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll(),
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ['catalog'],
    queryFn: () => catalogApi.getAll(),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  });

  // If editing, load invoice details
  const { data: existingInvoice } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.getOne(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingInvoice) {
      setClientId(existingInvoice.client_id || '');
      setInvoiceNumber(existingInvoice.invoice_number);
      setIssueDate(existingInvoice.issue_date?.substring(0, 10));
      setDueDate(existingInvoice.due_date?.substring(0, 10));
      setCurrency(existingInvoice.currency || 'USD');
      setTaxRate(Number(existingInvoice.tax_rate || 0));
      setDiscountType(existingInvoice.discount_type || 'none');
      setDiscountValue(Number(existingInvoice.discount_value || 0));
      setNotes(existingInvoice.notes || '');
      setTerms(existingInvoice.terms || 'Net 30 Days');
      if (existingInvoice.items && existingInvoice.items.length > 0) {
        setItems(
          existingInvoice.items.map((i: any) => ({
            description: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unit_price),
            taxRate: Number(i.tax_rate || 0),
            productId: i.product_id,
          })),
        );
      }
    } else if (clients.length > 0 && !clientId) {
      setClientId(clients[0].id);
    }
  }, [existingInvoice, clients]);

  // Calculations
  const subtotal = items.reduce((acc, itm) => acc + (Number(itm.quantity) || 0) * (Number(itm.unitPrice) || 0), 0);
  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = (subtotal * (Number(discountValue) || 0)) / 100;
  } else if (discountType === 'fixed') {
    discountAmount = Number(discountValue) || 0;
  }
  discountAmount = Math.min(discountAmount, subtotal);
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxable * (Number(taxRate) || 0)) / 100;
  const grandTotal = taxable + taxAmount;

  // Selected client details for preview
  const selectedClient = clients.find((c) => c.id === clientId);

  const saveMutation = useMutation({
    mutationFn: (status: string) => {
      const payload = {
        clientId,
        invoiceNumber: invoiceNumber.trim() || undefined,
        issueDate,
        dueDate,
        items,
        taxRate,
        discountType,
        discountValue,
        currency,
        notes,
        terms,
        status,
      };
      if (isEditing) {
        return invoicesApi.update(id!, payload);
      }
      return invoicesApi.create(payload);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success(
        isEditing ? `Invoice ${res.invoice_number || invoiceNumber} updated successfully!` : 'Invoice generated & saved!',
        'Invoice Saved',
      );
      navigate(`/invoices/${res.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save invoice.', 'Validation Error');
    },
  });

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: taxRate,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSelectCatalogItem = (index: number, productId: string) => {
    const prod = catalog.find((p) => p.id === productId);
    if (prod) {
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          productId: prod.id,
          description: prod.name + (prod.description ? ` – ${prod.description}` : ''),
          unitPrice: Number(prod.unit_price),
          taxRate: Number(prod.tax_rate || taxRate),
        };
        return updated;
      });
      toast.info(`Inserted "${prod.name}" rate card into line item.`, 'Catalog Selected');
    }
  };

  const handlePolishItemWithAi = async (index: number) => {
    const item = items[index];
    if (!item.description || item.description.trim().length === 0) {
      toast.warning('Please enter a brief description first to polish.', 'Item Empty');
      return;
    }
    setPolishingIndex(index);
    try {
      const res = await aiApi.polishItem(item.description);
      if (res.polishedDescription) {
        handleItemChange(index, 'description', res.polishedDescription);
        toast.success('Rewritten professionally with Gemini AI', 'Polished with AI');
      }
    } catch (e: any) {
      toast.error(e.message || 'AI Polish encountered an error', 'AI Error');
    } finally {
      setPolishingIndex(null);
    }
  };

  const handleRunAiInvoiceGenerator = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await aiApi.generateInvoice(aiPrompt);
      const data = res.invoiceData;

      // Try matching client name
      if (data.clientName) {
        const matched = clients.find(
          (c) =>
            c.name.toLowerCase().includes(data.clientName.toLowerCase()) ||
            data.clientName.toLowerCase().includes(c.name.toLowerCase()),
        );
        if (matched) setClientId(matched.id);
      }

      if (data.items && data.items.length > 0) {
        setItems(
          data.items.map((i: any) => ({
            description: i.description,
            quantity: Number(i.quantity || 1),
            unitPrice: Number(i.unitPrice || 0),
            taxRate: Number(i.taxRate ?? taxRate),
          })),
        );
      }

      if (data.taxRate !== undefined) setTaxRate(Number(data.taxRate));
      if (data.terms) setTerms(data.terms);
      if (data.notes) setNotes(data.notes);

      setShowAiModal(false);
      setAiPrompt('');
      toast.success('Generated line items, pricing & terms with Gemini AI!', 'AI Invoice Ready');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate invoice with AI.', 'AI Error');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isEditing ? `Edit Invoice #${invoiceNumber}` : 'Create New Invoice'}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fill in client, deliverables, and terms or generate with AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Tab Selector: Edit vs Preview */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'editor' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'preview' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          </div>

          {/* AI Generator Trigger */}
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30 rounded-xl transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
            <span>AI Fill</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate('draft')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            Save Draft
          </button>

          {/* Save & Finalize */}
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate('sent')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30 hover:-translate-y-0.5"
          >
            <Save className="w-4 h-4" />
            <span>Save & Finalize</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: FORM EDITOR --- */}
      {activeTab === 'editor' ? (
        <div className="space-y-6">
          {/* Section 1: Client & Metadata */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Client <span className="text-rose-500">*</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Invoice #</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Leave blank for auto-generate"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Section 2: Line Items Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Line Items</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Add billable products, milestones, or hourly tasks</p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30 rounded-xl transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, index) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                return (
                  <div key={index} className="py-4 space-y-3">
                    <div className="grid grid-cols-12 gap-3 items-start">
                      {/* Description + Catalog Quick Pick */}
                      <div className="col-span-12 md:col-span-6 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Description</label>
                          {catalog.length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) handleSelectCatalogItem(index, e.target.value);
                              }}
                              className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none rounded px-2 py-0.5 focus:outline-none"
                            >
                              <option value="">Insert from catalog...</option>
                              {catalog.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} (${c.unit_price})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="relative">
                          <textarea
                            rows={2}
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Deliverables description..."
                            className="w-full p-2.5 pr-20 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
                          />
                          <button
                            type="button"
                            onClick={() => handlePolishItemWithAi(index)}
                            disabled={polishingIndex === index}
                            className="absolute right-2 bottom-3 px-2 py-1 text-[10px] font-bold text-brand-700 dark:text-brand-300 bg-brand-100/60 dark:bg-brand-500/15 hover:bg-brand-200 dark:hover:bg-brand-500/30 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                            title="Enhance with AI"
                          >
                            <Sparkles className="w-3 h-3 text-brand-500" />
                            <span>{polishingIndex === index ? 'Polishing...' : 'Polish'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-4 md:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">Quantity</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-4 md:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">Unit Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500"
                        />
                      </div>

                      {/* Amount & Delete */}
                      <div className="col-span-4 md:col-span-2 flex items-center justify-between md:justify-end gap-3 pt-6">
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                          ${lineTotal.toFixed(2)}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Totals & Tax / Discount & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Notes & Terms */}
            <div className="md:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Payment Terms</label>
                <input
                  type="text"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="e.g. Net 30 Days"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Notes & Bank Remittance</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Include wire details or thank you note..."
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Financial Summary Calculation */}
            <div className="md:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 font-sans">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Summary & Calculations
              </h4>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Subtotal:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">${subtotal.toFixed(2)}</span>
              </div>

              {/* Discount Controls */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Discount:</span>
                <div className="flex items-center gap-1.5">
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="text-[11px] bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5"
                  >
                    <option value="none">None</option>
                    <option value="percentage">%</option>
                    <option value="fixed">$</option>
                  </select>
                  {discountType !== 'none' && (
                    <input
                      type="number"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      className="w-16 px-1.5 py-0.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-right font-mono"
                    />
                  )}
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold w-16 text-right">
                    -${discountAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Tax Rate Controls */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span>Tax:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-12 px-1 py-0.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-right font-mono"
                  />
                  <span>%</span>
                </div>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">${taxAmount.toFixed(2)}</span>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Grand Total:</span>
                <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400 font-mono">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* --- TAB 2: LIVE DOCUMENT PREVIEW --- */
        <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-slate-800 font-sans">
          {/* Header */}
          <div className="flex items-start justify-between pb-8 border-b-2 border-indigo-600">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {settings?.company_name || user?.companyName || 'Invoicer AI Business'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{settings?.email || user?.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{settings?.phone}</p>
              {settings?.tax_id && <p className="text-xs text-slate-500 dark:text-slate-400">Tax ID: {settings.tax_id}</p>}
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-wider">INVOICE</span>
              <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
                # {invoiceNumber || 'INV-2026-DRAFT'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Issue: {formatDate(issueDate)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Due: {formatDate(dueDate)}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="py-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billed To</span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {selectedClient?.name || 'Client Name'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">{selectedClient?.email}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">{selectedClient?.address}</p>
            {selectedClient?.tax_number && (
              <p className="text-xs text-slate-600 dark:text-slate-300">Tax Number: {selectedClient.tax_number}</p>
            )}
          </div>

          {/* Table */}
          <table className="w-full text-left text-xs my-4 border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((itm, i) => (
                <tr key={i}>
                  <td className="py-3 px-3 text-slate-800 dark:text-slate-200">{itm.description}</td>
                  <td className="py-3 px-3 text-right font-mono">{itm.quantity}</td>
                  <td className="py-3 px-3 text-right font-mono">${Number(itm.unitPrice).toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    ${(Number(itm.quantity) * Number(itm.unitPrice)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="w-64 space-y-1.5 text-xs text-right">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Subtotal:</span>
                <span className="font-mono font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount:</span>
                  <span className="font-mono font-semibold">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tax ({taxRate}%):</span>
                  <span className="font-mono font-semibold">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white">
                <span>Total Due:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold font-mono">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          {(terms || notes) && (
            <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              {terms && <p><strong>Terms:</strong> {terms}</p>}
              {notes && <p><strong>Notes:</strong> {notes}</p>}
            </div>
          )}
        </div>
      )}

      {/* --- AI NATURAL LANGUAGE INVOICE GENERATOR MODAL --- */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 text-brand-600 dark:text-brand-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Generate Invoice with Gemini AI</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Describe the client, deliverables, hours, and rates in plain text. The AI will structure line items,
              quantities, prices, and terms automatically.
            </p>

            <textarea
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Invoice Acme Global for 20 hours of backend architecture at $150/hr and $300 database indexing fee with Net 15 terms."
              className="w-full p-3.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
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
                disabled={aiLoading || !aiPrompt.trim()}
                onClick={handleRunAiInvoiceGenerator}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiLoading ? 'Generating...' : 'Apply to Invoice'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
