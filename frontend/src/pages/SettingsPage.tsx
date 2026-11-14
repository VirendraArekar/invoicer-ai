import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building,
  DollarSign,
  Save,
  Sparkles,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';
import { settingsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [taxId, setTaxId] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [defaultTaxRate, setDefaultTaxRate] = useState<number>(8.25);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState('Net 30');
  const [invoiceNotesTemplate, setInvoiceNotesTemplate] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  });

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name || user?.companyName || '');
      setEmail(settings.email || user?.email || '');
      setPhone(settings.phone || '');
      setWebsite(settings.website || '');
      setTaxId(settings.tax_id || '');
      setAddressLine1(settings.address_line1 || '');
      setAddressLine2(settings.address_line2 || '');
      setCity(settings.city || '');
      setState(settings.state || '');
      setPostalCode(settings.postal_code || '');
      setCountry(settings.country || 'United States');
      setDefaultCurrency(settings.default_currency || user?.currency || 'USD');
      setDefaultTaxRate(Number(settings.default_tax_rate ?? 8.25));
      setDefaultPaymentTerms(settings.default_payment_terms || 'Net 30');
      setInvoiceNotesTemplate(
        settings.invoice_notes_template ||
          'Thank you for your business. Please remit payment by the due date.',
      );
    }
  }, [settings, user]);

  const saveMutation = useMutation({
    mutationFn: () =>
      settingsApi.update({
        companyName,
        email,
        phone,
        website,
        taxId,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        defaultCurrency,
        defaultTaxRate: Number(defaultTaxRate),
        defaultPaymentTerms,
        invoiceNotesTemplate,
      }),
    onSuccess: (updated: any) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      updateUser({
        companyName: updated.company_name,
        currency: updated.default_currency,
      });
      toast.success('Workspace preferences and billing terms updated!', 'Settings Saved');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update settings.', 'Settings Error');
    },
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure company branding, default terms, currency, themes, and Gemini AI engine
          </p>
        </div>
      </div>

      {/* --- APPEARANCE & THEME PREFERENCE --- */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Palette className="w-4 h-4 text-brand-500" />
          <span>Appearance & Theme Mode</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select your visual preference. Light mode offers a high-contrast crisp look; Dark mode delivers a sleek SaaS aesthetic.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-md pt-2">
          {/* Light Mode Card */}
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              toast.info('Switched to Light Mode', 'Theme Updated');
            }}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              theme === 'light'
                ? 'border-brand-500 bg-brand-50/50 shadow-md ring-2 ring-brand-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
              {theme === 'light' && (
                <span className="w-2 h-2 rounded-full bg-brand-500" />
              )}
            </div>
            <p className="text-xs font-bold text-slate-900">Light Mode</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Crisp white & clean slate</p>
          </button>

          {/* Dark Mode Card */}
          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              toast.info('Switched to Dark Mode', 'Theme Updated');
            }}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              theme === 'dark'
                ? 'border-brand-500 bg-brand-950/40 shadow-md ring-2 ring-brand-500/20'
                : 'border-slate-700 hover:border-slate-600 bg-slate-950'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-400'}`} />
              {theme === 'dark' && (
                <span className="w-2 h-2 rounded-full bg-brand-500" />
              )}
            </div>
            <p className="text-xs font-bold text-slate-100">Dark Mode</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Midnight navy & indigo</p>
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="space-y-6"
      >
        {/* Section 1: Business Profile */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-brand-500" />
            <span>Business Organization Profile</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Trading Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nexus Cloud Technologies Inc."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Billing Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@nexuscloud.io"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (512) 800-4920"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://nexuscloud.io"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Business Tax ID / EIN / VAT</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="US-849203918-TX"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="100 Innovation Way, Suite 400"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Austin"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">State / Region</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="TX"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="78701"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Invoicing Defaults */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>Default Invoicing Configurations</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Currency</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Payment Terms</label>
              <select
                value={defaultPaymentTerms}
                onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 45">Net 45 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Standard Invoice Notes Template</label>
              <textarea
                rows={3}
                value={invoiceNotesTemplate}
                onChange={(e) => setInvoiceNotesTemplate(e.target.value)}
                placeholder="Standard wire remittance instructions or thank you message..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: AI Engine Parameters */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
              <span>Google Gemini AI Engine</span>
            </h3>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              gemini-4-hydrogen Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Powers autonomous invoice synthesis, intelligent item polishing, tone-adaptive debt collection reminders,
            and cash flow insights.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span>Selected Frontier Model:</span>
              <strong className="text-brand-600 dark:text-brand-400 font-mono">gemini-4-hydrogen</strong>
            </div>
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span>SDK Library:</span>
              <span className="font-mono text-slate-500 dark:text-slate-400">@google/genai ^3.3.0</span>
            </div>
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span>Automatic Heuristic Fallback:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Enabled (Zero downtime)</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/30 hover:-translate-y-0.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Workspace Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
