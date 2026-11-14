import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Send,
  Receipt,
  Copy,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { aiApi } from '../services/api';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AiAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'advisor' | 'generator' | 'collector' | 'receipt'>(
    'advisor',
  );

  // --- SUBMODULE 1: INVOICE GENERATOR STATE ---
  const [nlPrompt, setNlPrompt] = useState(
    'Bill Acme Global Ventures for 12 hours of full-stack AI engineering at $160/hr and $450 server setup fee with Net 30 terms and 8.25% tax',
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);

  // --- SUBMODULE 2: FINANCIAL ADVISOR STATE ---
  const { data: insights, isLoading: insightsLoading, refetch: refetchInsights } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => aiApi.getFinancialInsights(),
  });

  // --- SUBMODULE 3: SMART DEBT COLLECTION STATE ---
  const [reminderTone, setReminderTone] = useState<'polite' | 'firm' | 'urgent'>('firm');
  const [reminderClient, setReminderClient] = useState('Apex BioDynamics Ltd');
  const [reminderInvoiceNum, setReminderInvoiceNum] = useState('INV-2026-003');
  const [reminderAmount, setReminderAmount] = useState(9500);
  const [reminderDays, setReminderDays] = useState(9);
  const [reminderDraft, setReminderDraft] = useState<any>(null);
  const [reminderLoading, setReminderLoading] = useState(false);

  // --- SUBMODULE 4: RECEIPT OCR STATE ---
  const [receiptText, setReceiptText] = useState(
    'Google Cloud Platform Invoice #GCP-88410 Date: 11/02/2026 Description: Gemini 4 Hydrogen model API token consumption Total: $380.00 Tax: $0.00',
  );
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);

  const handleGenerateInvoice = async () => {
    if (!nlPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await aiApi.generateInvoice(nlPrompt);
      setGeneratedInvoice(res.invoiceData);
      toast.success('Generated full structured invoice using Gemini AI!', 'AI Synthesis Complete');
    } catch (e: any) {
      toast.error(e.message || 'Failed to synthesize invoice with AI.', 'AI Error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDraftReminder = async (tone = reminderTone) => {
    setReminderLoading(true);
    try {
      const res = await aiApi.draftReminder({
        invoiceNumber: reminderInvoiceNum,
        clientName: reminderClient,
        amountDue: reminderAmount,
        daysOverdue: reminderDays,
        tone,
      });
      setReminderDraft(res);
      toast.success(`Drafted ${tone} late-payment reminder using Gemini AI!`, 'Reminder Drafted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to draft AI reminder.', 'AI Error');
    } finally {
      setReminderLoading(false);
    }
  };

  const handleParseReceipt = async () => {
    if (!receiptText.trim()) return;
    setOcrLoading(true);
    try {
      const res = await aiApi.parseReceipt(receiptText);
      setOcrResult(res);
      toast.success('Extracted vendor, total, and tax status from raw receipt!', 'Receipt Parsed');
    } catch (e: any) {
      toast.error(e.message || 'Failed to parse receipt with AI.', 'AI Error');
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Gemini AI Copilot & Financial Intelligence</span>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20">
              Active
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Natural language invoicing, tone-adaptive debt collection, receipt OCR, and runway advisory
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <button
          onClick={() => setActiveTab('advisor')}
          className={`flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-2xl border transition-all ${
            activeTab === 'advisor'
              ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Strategic Advisor</span>
        </button>

        <button
          onClick={() => setActiveTab('generator')}
          className={`flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-2xl border transition-all ${
            activeTab === 'generator'
              ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>NL Invoice Generator</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('collector');
            if (!reminderDraft) handleDraftReminder(reminderTone);
          }}
          className={`flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-2xl border transition-all ${
            activeTab === 'collector'
              ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Smart Debt Collection</span>
        </button>

        <button
          onClick={() => setActiveTab('receipt')}
          className={`flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-2xl border transition-all ${
            activeTab === 'receipt'
              ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Receipt OCR Parser</span>
        </button>
      </div>

      {/* --- TAB 1: STRATEGIC ADVISOR --- */}
      {activeTab === 'advisor' && (
        <div className="space-y-6">
          {insightsLoading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Synthesizing real-time business pulse...</p>
            </div>
          ) : (
            <>
              {/* Executive Summary Card */}
              <div className="p-8 rounded-3xl bg-gradient-to-r from-brand-50 via-white to-indigo-50/60 dark:from-slate-900 dark:via-brand-950/40 dark:to-slate-900 border border-brand-200 dark:border-brand-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-brand-600/10 dark:bg-brand-600/20 border border-brand-500/40 text-brand-600 dark:text-brand-300 shrink-0">
                    <span className="text-2xl font-black font-mono">{insights?.financialHealthScore || 80}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Health</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300">
                        {insights?.cashFlowStatus || 'Strong Growth'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Runway: <strong className="text-slate-900 dark:text-white">{insights?.estimatedRunwayMonths} months</strong>
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white max-w-xl">{insights?.executiveSummary}</p>
                  </div>
                </div>

                <div className="text-left md:text-right shrink-0">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Projected Next Month Inflow</span>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {formatCurrency(insights?.projectedNextMonthRevenue, user?.currency)}
                  </p>
                  <button
                    onClick={() => {
                      refetchInsights();
                      toast.info('Re-evaluating financial pulse...', 'Analyzing');
                    }}
                    className="mt-3 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-300 hover:text-brand-700 dark:hover:text-white bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 rounded-lg transition-all"
                  >
                    Re-Analyze Pulse
                  </button>
                </div>
              </div>

              {/* Actionable Moves Grid */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                  <Zap className="w-5 h-5" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Recommended Strategic Financial Moves</h3>
                </div>

                <div className="space-y-3">
                  {(insights?.topActionableInsights || []).map((action: string, i: number) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-start gap-3 hover:border-brand-500/30 transition-colors"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-bold text-xs shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* --- TAB 2: NATURAL LANGUAGE INVOICE GENERATOR --- */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-brand-500" />
              <span>Synthesize Complete Invoice from Natural Language</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Type unstructured client hours, milestones, flat fees, discounts, and payment terms. Gemini AI
              extracts deliverables, computes subtotal and tax, and formats it instantly.
            </p>

            <textarea
              rows={4}
              value={nlPrompt}
              onChange={(e) => setNlPrompt(e.target.value)}
              className="w-full p-3.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setNlPrompt(
                    'Invoice Starlight Media for 30 hours UI/UX design sprint at $125/hr and $250 font licensing with Net 15 terms',
                  );
                  toast.info('Loaded UI/UX design prompt sample.');
                }}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Insert Sample Prompt
              </button>

              <button
                type="button"
                disabled={isGenerating || !nlPrompt.trim()}
                onClick={handleGenerateInvoice}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30 disabled:opacity-50 hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? 'Synthesizing with Gemini...' : 'Synthesize Invoice'}</span>
              </button>
            </div>
          </div>

          {generatedInvoice && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    Generated Result
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {generatedInvoice.clientName || 'Client Name'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Invoice #{generatedInvoice.invoiceNumber || 'INV-2026-AI'} · Terms:{' '}
                    {generatedInvoice.terms || 'Net 30'}
                  </p>
                </div>

                <button
                  onClick={() => navigate('/invoices/new')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/30 hover:-translate-y-0.5"
                >
                  <span>Open in Invoice Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Tax %</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {(generatedInvoice.items || []).map((itm: any, i: number) => (
                      <tr key={i}>
                        <td className="py-3 px-3 text-slate-900 dark:text-white font-medium">{itm.description}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{itm.quantity}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          ${Number(itm.unitPrice).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500 dark:text-slate-400">{itm.taxRate}%</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ${(Number(itm.quantity) * Number(itm.unitPrice)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: SMART DEBT COLLECTION --- */}
      {activeTab === 'collector' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-brand-500" />
              <span>Tone-Adaptive Late Payment Reminder Drafter</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recover receivables faster without damaging client goodwill. Choose from polite courtesy reminders,
              firm business inquiries, or critical escalation notices.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Client Name</label>
                <input
                  type="text"
                  value={reminderClient}
                  onChange={(e) => setReminderClient(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Invoice #</label>
                <input
                  type="text"
                  value={reminderInvoiceNum}
                  onChange={(e) => setReminderInvoiceNum(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Amount Due ($)</label>
                <input
                  type="number"
                  value={reminderAmount}
                  onChange={(e) => setReminderAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Days Overdue</label>
                <input
                  type="number"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Select Follow-up Tone:</label>
              <div className="grid grid-cols-3 gap-3">
                {(['polite', 'firm', 'urgent'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setReminderTone(t);
                      handleDraftReminder(t);
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
          </div>

          {reminderLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Synthesizing follow-up with Gemini AI...</p>
            </div>
          ) : reminderDraft ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Drafted Email Preview</h4>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Subject: ${reminderDraft.subject}\n\n${reminderDraft.body}`,
                    );
                    toast.success('Subject and email body copied to clipboard!', 'Copied');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30 rounded-xl transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Subject & Body</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium mb-1">Subject</span>
                  <input
                    type="text"
                    readOnly
                    value={reminderDraft.subject}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium mb-1">Message</span>
                  <textarea
                    rows={8}
                    readOnly
                    value={reminderDraft.body}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 leading-relaxed font-sans focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* --- TAB 4: RECEIPT OCR EXTRACTOR --- */}
      {activeTab === 'receipt' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-brand-500" />
              <span>Receipt OCR & Tax Deduction Parser</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste raw invoice receipts, terminal slips, or transaction notifications. Gemini AI extracts the vendor,
              date, amount, and determines tax deductibility.
            </p>

            <textarea
              rows={4}
              value={receiptText}
              onChange={(e) => setReceiptText(e.target.value)}
              className="w-full p-3.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />

            <div className="flex justify-end">
              <button
                type="button"
                disabled={ocrLoading || !receiptText.trim()}
                onClick={handleParseReceipt}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30 disabled:opacity-50 hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{ocrLoading ? 'Parsing Receipt...' : 'Parse Receipt with AI'}</span>
              </button>
            </div>
          </div>

          {ocrResult && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Parsed Expense Data
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{ocrResult.vendor}</h4>
                </div>

                <button
                  onClick={() => navigate('/expenses')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/30 hover:-translate-y-0.5"
                >
                  <span>Go to Expenses</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block">Total Amount</span>
                  <span className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-1 block">
                    ${Number(ocrResult.amount).toFixed(2)}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block">Tax Portion</span>
                  <span className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-1 block">
                    ${Number(ocrResult.taxAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block">Category</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white mt-1 block">{ocrResult.category}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block">Tax Deductible</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {ocrResult.isTaxDeductible ? 'Yes (100%)' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
