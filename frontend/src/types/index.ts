export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  companyName?: string;
  currency?: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tax_number?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'archived';
  total_invoices?: number;
  total_billed?: number;
  outstanding_balance?: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  sku?: string;
  unit_price: number;
  tax_rate: number;
  category: string;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  total?: number;
  sort_order?: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_type: 'none' | 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  currency: string;
  notes?: string;
  terms?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_city?: string;
  client_state?: string;
  client_country?: string;
  client_tax_number?: string;
  item_count?: number;
  items?: InvoiceItem[];
  payments?: Payment[];
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  invoice_id: string;
  invoice_number?: string;
  client_name?: string;
  currency?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_reference?: string;
  notes?: string;
  receipt_url?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  client_id?: string;
  client_name?: string;
  category: string;
  vendor: string;
  amount: number;
  tax_amount: number;
  is_tax_deductible: boolean;
  expense_date: string;
  description?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  company_name: string;
  email: string;
  phone?: string;
  website?: string;
  tax_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  logo_url?: string;
  default_currency: string;
  default_tax_rate: number;
  default_payment_terms: string;
  invoice_notes_template?: string;
}

export interface DashboardSummary {
  metrics: {
    totalRevenue: number;
    totalBilled: number;
    outstandingBalance: number;
    overdueAmount: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    totalClients: number;
    invoices: {
      total: number;
      paid: number;
      overdue: number;
      pending: number;
      draft: number;
    };
  };
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  recentInvoices: Invoice[];
  recentPayments: Payment[];
  aiPulse: {
    healthScore: number;
    status: string;
    summary: string;
    runwayMonths: number;
    recommendation: string;
  };
}
