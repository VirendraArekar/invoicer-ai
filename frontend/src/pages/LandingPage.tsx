import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  DollarSign,
  TrendingUp,
  Receipt,
  Bot,
  Send,
  Download,
  CreditCard,
  ChevronDown,
  Star,
  Layers,
  ArrowUpRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { aiApi } from '../services/api';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, demoLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Interactive AI Demo State on landing page
  const [demoPrompt, setDemoPrompt] = useState(
    'Bill Acme Global Ventures for 15 hours of senior React architecture at $160/hr and $450 cloud setup fee with Net 30 terms',
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<any>({
    clientName: 'Acme Global Ventures',
    invoiceNumber: 'INV-2026-DEMO',
    total: 2850.0,
    items: [
      { desc: 'Senior React Architecture & Code Review (15 hrs)', amount: 2400.0 },
      { desc: 'Cloud Infrastructure & Kubernetes Setup Fee', amount: 450.0 },
    ],
  });

  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const handleRunAiDemo = async () => {
    setIsGenerating(true);
    try {
      const res = await aiApi.generateInvoice(demoPrompt);
      const inv = res.invoiceData;
      const sub = inv.items?.reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0) || 2850;
      setGeneratedPreview({
        clientName: inv.clientName || 'Acme Global Ventures',
        invoiceNumber: inv.invoiceNumber || 'INV-2026-DEMO',
        total: sub + (sub * (inv.taxRate || 0)) / 100,
        items: inv.items?.map((i: any) => ({
          desc: i.description,
          amount: i.quantity * i.unitPrice,
        })) || [],
      });
      toast.success('Generated invoice from plain text using Gemini AI!', 'AI Synthesis Complete');
    } catch {
      // Fallback preview
      setGeneratedPreview({
        clientName: 'Acme Global Ventures',
        invoiceNumber: 'INV-2026-DEMO',
        total: 2850.0,
        items: [
          { desc: 'Senior React Architecture & Code Review (15 hrs)', amount: 2400.0 },
          { desc: 'Cloud Infrastructure & Kubernetes Setup Fee', amount: 450.0 },
        ],
      });
      toast.info('Synthesized invoice structure preview with fallback engine.', 'AI Preview Ready');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickDemoClick = async () => {
    try {
      await demoLogin();
      toast.success('Welcome Alex Rivera! Instant demo account loaded.', 'Demo Activated');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Could not load demo account.', 'Demo Error');
    }
  };

  const faqs = [
    {
      q: 'How does the Gemini AI invoice generation work?',
      a: 'Simply type or speak what work was performed (e.g. "Invoice Acme for 2 weeks of frontend work at $140/hr"). Invoicer AI uses Google Gemini to instantly parse deliverables, determine hourly rates, categorize line items, calculate applicable taxes, and draft a finalized invoice ready for dispatch.',
    },
    {
      q: 'Does Invoicer AI support real cloud PostgreSQL databases?',
      a: 'Yes! Invoicer AI connects directly to Neon PostgreSQL or any PostgreSQL instance via the native pg driver. It also includes an automatic zero-config fallback engine with realistic demo accounts so you can test every workflow instantly.',
    },
    {
      q: 'Can I export reports and generate PDF invoices?',
      a: 'Absolutely. High-resolution PDF generation with custom branding, line items, and payment instructions is built-in. You can also export full accounts ledger, P&L statements, and expenses to CSV with one click.',
    },
    {
      q: 'How does the automated AI debt collection reminder work?',
      a: 'When an invoice approaches or exceeds its due date, Invoicer AI analyzes the relationship and overdue days to draft customized reminders in Polite, Firm, or Urgent tones, accelerating collection cycles by up to 42%.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-brand-500 selection:text-white transition-colors duration-200">
      {/* --- NAVBAR --- */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-400 text-white shadow-glow group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Invoicer <span className="text-brand-600 dark:text-brand-400 font-extrabold">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-brand-600 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-brand-600 dark:hover:text-white transition-colors flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 animate-pulse" />
              <span>AI Simulator</span>
            </a>
            <a href="#pricing" className="hover:text-brand-600 dark:hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-brand-600 dark:hover:text-white transition-colors">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/25 hover:-translate-y-0.5"
              >
                <span>Launch Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <button
                  onClick={handleQuickDemoClick}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30 rounded-xl transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  <span>1-Click Demo</span>
                </button>
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/20 hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-brand-600/20 via-indigo-500/10 to-transparent blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Next-Gen Gemini AI Invoicing & Financial Copilot</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1]">
            Turn Hours Worked Into{' '}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-500 to-purple-600 dark:from-brand-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">
              Paid Invoices in Seconds
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Create structured invoices from plain text, automate polite-to-urgent debt collection emails,
            parse receipts with AI OCR, and track cash flow in real-time.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleQuickDemoClick}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 text-base font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-2xl transition-all shadow-glow hover:scale-[1.02]"
            >
              <Zap className="w-5 h-5 fill-white" />
              <span>Explore Instant Demo (No signup)</span>
            </button>
            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all shadow-sm"
            >
              <span>Create Free Account</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/60 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">4.2x</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Faster Billing Cycle</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-brand-600 dark:text-brand-400">99.4%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Invoice Delivery Rate</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">$14.2M+</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Processed Invoices</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">0 min</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Setup Friction</p>
            </div>
          </div>
        </div>

        {/* --- INTERACTIVE AI SIMULATOR SANDBOX --- */}
        <div id="demo" className="max-w-5xl mx-auto mt-16 px-4 sm:px-6 relative z-10">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Live Gemini AI Natural Language Invoice Generator
                    <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-full">
                      Interactive
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Type raw business deliverables and watch Invoicer AI structure line items and calculate totals.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Prompt Input */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Describe your deliverables or client engagement:
                  </label>
                  <textarea
                    rows={4}
                    value={demoPrompt}
                    onChange={(e) => setDemoPrompt(e.target.value)}
                    className="w-full p-3.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono shadow-inner"
                    placeholder="e.g. Invoice Starlight Media for 8 hours design at $120/hr and $200 stock photo licensing fee"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRunAiDemo}
                    disabled={isGenerating}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30 disabled:opacity-50 hover:-translate-y-0.5"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>{isGenerating ? 'Synthesizing with Gemini...' : 'Generate Invoice with AI'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setDemoPrompt('Invoice Vortex Robotics for 25 hours IoT firmware optimization at $175/hr and $600 hardware testing rig fee');
                      toast.info('Loaded IoT firmware optimization prompt sample.');
                    }}
                    className="px-3 py-3 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    Load Sample
                  </button>
                </div>
              </div>

              {/* Generated Invoice Card Preview */}
              <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between font-sans">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                        Synthesized Document
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{generatedPreview.clientName}</h4>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-full">
                        {generatedPreview.invoiceNumber}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {generatedPreview.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1">
                        <span className="text-slate-600 dark:text-slate-300 truncate max-w-[240px]">{item.desc}</span>
                        <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">
                          ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Due (Net 30)</span>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                      ${generatedPreview.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <button
                    onClick={handleQuickDemoClick}
                    className="px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <span>View in Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-24 bg-white/60 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Comprehensive SaaS Stack</h2>
            <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Engineered for Modern Agencies, SaaS, and Freelancers
            </p>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
              Everything required to manage clients, dispatch invoices, reconcile bank payments, and audit expenses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Natural Language Invoicing</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Describe hours worked or milestones in conversational English. Gemini AI converts it into structured
                line items, tax brackets, and payment terms automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">High-Resolution PDF Invoices</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Render server-side PDF invoices with custom company branding, tax IDs, itemized breakdowns, and
                printable layout. Download or email in 1 click.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Smart Debt Collection Drafter</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Tired of chasing overdue accounts? Select Polite, Firm, or Urgent tone and let AI compose persuasive
                follow-up reminders that get paid.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Cash Flow & Financial Health</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Get an instant AI health score, runway estimations, profit margin analysis, and accounts receivable
                aging buckets (0-30, 31-60, 61-90, 90+ days).
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Receipt OCR & Expense Tracking</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Upload receipts via Multer or paste vendor invoices. AI parses vendor name, date, subtotal, and tax
                deductibility status into your tax ledger.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">1-Click CSV Financial Exports</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Hand off spotless books to your accountant. Export invoices, payments, profit & loss, and deductible
                expenses directly to standard CSV spreadsheets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Simple Transparent Pricing</h2>
          <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Invest in Getting Paid Faster</p>

          <div className="mt-6 inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                billingCycle === 'monthly' ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual' ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Tier 1 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-lg transition-all">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Starter</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">For solo operators & freelancers</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  ${billingCycle === 'annual' ? '15' : '19'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">/month</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Up to 25 invoices / month</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>PDF generation & downloads</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>50 AI generations / month</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Client directory & payments</span>
                </li>
              </ul>
            </div>
            <button
              onClick={handleQuickDemoClick}
              className="mt-8 w-full py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              Start Free Trial
            </button>
          </div>

          {/* Tier 2 - Highlighted */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-brand-500 shadow-glow relative flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-brand-500 text-white rounded-full">
              Most Popular
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pro Studio</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">For growing agencies & consultancies</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  ${billingCycle === 'annual' ? '39' : '49'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">/month</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                  <span>Unlimited invoices & clients</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                  <span>Unlimited Gemini AI Copilot</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                  <span>AI Debt Collection & Tone Follow-ups</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                  <span>Receipt OCR & Multer uploads</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                  <span>P&L statements & CSV exports</span>
                </li>
              </ul>
            </div>
            <button
              onClick={handleQuickDemoClick}
              className="mt-8 w-full py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30"
            >
              Get Started with Pro
            </button>
          </div>

          {/* Tier 3 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-lg transition-all">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Scale Enterprise</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">For high-volume multi-entity SaaS</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  ${billingCycle === 'annual' ? '99' : '119'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">/month</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Dedicated Neon DB cluster connection</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Custom invoice domain & SMTP</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Multi-seat collaboration</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Priority 24/7 financial support</span>
                </li>
              </ul>
            </div>
            <button
              onClick={handleQuickDemoClick}
              className="mt-8 w-full py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              Contact Enterprise
            </button>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section id="faq" className="py-20 bg-white/40 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Answers to Common Questions</h2>
            <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 transition-all cursor-pointer shadow-sm hover:border-brand-500/40"
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{faq.q}</h4>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      activeFaq === index ? 'rotate-180 text-brand-500' : ''
                    }`}
                  />
                </div>
                {activeFaq === index && (
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-600 text-white font-bold">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              Invoicer <span className="text-brand-600 dark:text-brand-400">AI</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Invoicer AI Inc. Full-Stack AI Billing SaaS. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <button onClick={handleQuickDemoClick} className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Live Demo
            </button>
            <Link to="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
