import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CsvService } from './csv.service';

@Injectable()
export class ReportsService {
  constructor(
    private db: DatabaseService,
    private csvService: CsvService,
  ) {}

  async getProfitLoss(userId: string) {
    let invoices: any[] = [];
    let payments: any[] = [];
    let expenses: any[] = [];

    if (this.db.isConnectedToPostgres) {
      const invRes = await this.db.query('SELECT * FROM invoices WHERE user_id = $1', [userId]);
      const payRes = await this.db.query('SELECT * FROM payments WHERE user_id = $1', [userId]);
      const expRes = await this.db.query('SELECT * FROM expenses WHERE user_id = $1', [userId]);
      invoices = invRes.rows;
      payments = payRes.rows;
      expenses = expRes.rows;
    } else {
      invoices = this.db.getTable('invoices').filter((i) => i.user_id === userId);
      payments = this.db.getTable('payments').filter((p) => p.user_id === userId);
      expenses = this.db.getTable('expenses').filter((e) => e.user_id === userId);
    }

    const totalIncome = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    // Categorized expenses
    const expensesByCategory: Record<string, number> = {};
    for (const exp of expenses) {
      const cat = exp.category || 'Other';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(exp.amount || 0);
    }

    return {
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      margin: totalIncome > 0 ? Number(((netProfit / totalIncome) * 100).toFixed(1)) : 0,
      expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount: Number(amount.toFixed(2)),
      })),
    };
  }

  async getTaxSummary(userId: string) {
    let invoices: any[] = [];
    let expenses: any[] = [];

    if (this.db.isConnectedToPostgres) {
      const invRes = await this.db.query('SELECT * FROM invoices WHERE user_id = $1', [userId]);
      const expRes = await this.db.query('SELECT * FROM expenses WHERE user_id = $1', [userId]);
      invoices = invRes.rows;
      expenses = expRes.rows;
    } else {
      invoices = this.db.getTable('invoices').filter((i) => i.user_id === userId);
      expenses = this.db.getTable('expenses').filter((e) => e.user_id === userId);
    }

    const taxCollected = invoices.reduce((acc, i) => acc + Number(i.tax_amount || 0), 0);
    const taxPaidOnExpenses = expenses.reduce((acc, e) => acc + Number(e.tax_amount || 0), 0);
    const netTaxOwed = Math.max(0, taxCollected - taxPaidOnExpenses);

    return {
      taxCollected: Number(taxCollected.toFixed(2)),
      taxPaidOnExpenses: Number(taxPaidOnExpenses.toFixed(2)),
      netTaxOwed: Number(netTaxOwed.toFixed(2)),
      taxableSales: Number(invoices.reduce((acc, i) => acc + Number(i.subtotal || 0), 0).toFixed(2)),
      deductibleExpenses: Number(
        expenses
          .filter((e) => e.is_tax_deductible)
          .reduce((acc, e) => acc + Number(e.amount || 0), 0)
          .toFixed(2),
      ),
    };
  }

  async getAgingAccountsReceivable(userId: string) {
    let invoices: any[] = [];
    let clients: any[] = [];

    if (this.db.isConnectedToPostgres) {
      const invRes = await this.db.query('SELECT * FROM invoices WHERE user_id = $1 AND balance_due > 0', [userId]);
      const cliRes = await this.db.query('SELECT id, name FROM clients WHERE user_id = $1', [userId]);
      invoices = invRes.rows;
      clients = cliRes.rows;
    } else {
      invoices = this.db
        .getTable('invoices')
        .filter((i) => i.user_id === userId && Number(i.balance_due || 0) > 0);
      clients = this.db.getTable('clients').filter((c) => c.user_id === userId);
    }

    const now = new Date();
    const buckets = {
      current: 0, // due_date >= today
      days1To30: 0,
      days31To60: 0,
      days61To90: 0,
      days90Plus: 0,
    };

    const clientMap = new Map(clients.map((c) => [c.id, c.name]));
    const itemizedOverdue: any[] = [];

    for (const inv of invoices) {
      const balance = Number(inv.balance_due || 0);
      const dueDate = new Date(inv.due_date);
      const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        buckets.current += balance;
      } else if (diffDays <= 30) {
        buckets.days1To30 += balance;
        itemizedOverdue.push({
          ...inv,
          client_name: clientMap.get(inv.client_id) || 'Unknown',
          overdue_days: diffDays,
          bucket: '1-30 Days',
        });
      } else if (diffDays <= 60) {
        buckets.days31To60 += balance;
        itemizedOverdue.push({
          ...inv,
          client_name: clientMap.get(inv.client_id) || 'Unknown',
          overdue_days: diffDays,
          bucket: '31-60 Days',
        });
      } else if (diffDays <= 90) {
        buckets.days61To90 += balance;
        itemizedOverdue.push({
          ...inv,
          client_name: clientMap.get(inv.client_id) || 'Unknown',
          overdue_days: diffDays,
          bucket: '61-90 Days',
        });
      } else {
        buckets.days90Plus += balance;
        itemizedOverdue.push({
          ...inv,
          client_name: clientMap.get(inv.client_id) || 'Unknown',
          overdue_days: diffDays,
          bucket: '90+ Days',
        });
      }
    }

    const totalOverdue =
      buckets.days1To30 + buckets.days31To60 + buckets.days61To90 + buckets.days90Plus;

    return {
      buckets: {
        current: Number(buckets.current.toFixed(2)),
        days1To30: Number(buckets.days1To30.toFixed(2)),
        days31To60: Number(buckets.days31To60.toFixed(2)),
        days61To90: Number(buckets.days61To90.toFixed(2)),
        days90Plus: Number(buckets.days90Plus.toFixed(2)),
      },
      totalOverdue: Number(totalOverdue.toFixed(2)),
      totalOutstanding: Number((buckets.current + totalOverdue).toFixed(2)),
      itemizedOverdue: itemizedOverdue.sort((a, b) => b.overdue_days - a.overdue_days),
    };
  }

  async exportInvoicesCsv(userId: string): Promise<string> {
    let invoices: any[] = [];
    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(
        `SELECT i.*, c.name as client_name 
         FROM invoices i 
         LEFT JOIN clients c ON c.id = i.client_id 
         WHERE i.user_id = $1 
         ORDER BY i.issue_date DESC`,
        [userId],
      );
      invoices = res.rows;
    } else {
      const all = this.db.getTable('invoices').filter((i) => i.user_id === userId);
      const clients = this.db.getTable('clients');
      invoices = all.map((i) => ({
        ...i,
        client_name: clients.find((c) => c.id === i.client_id)?.name || 'N/A',
      }));
    }

    const headers = [
      { key: 'invoice_number', label: 'Invoice #' },
      { key: 'client_name', label: 'Client' },
      { key: 'status', label: 'Status' },
      { key: 'issue_date', label: 'Issue Date' },
      { key: 'due_date', label: 'Due Date' },
      { key: 'currency', label: 'Currency' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'tax_amount', label: 'Tax' },
      { key: 'total_amount', label: 'Total' },
      { key: 'amount_paid', label: 'Paid' },
      { key: 'balance_due', label: 'Balance Due' },
    ];

    return this.csvService.toCsv(invoices, headers);
  }

  async exportExpensesCsv(userId: string): Promise<string> {
    let expenses: any[] = [];
    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(
        `SELECT e.*, c.name as client_name 
         FROM expenses e 
         LEFT JOIN clients c ON c.id = e.client_id 
         WHERE e.user_id = $1 
         ORDER BY e.expense_date DESC`,
        [userId],
      );
      expenses = res.rows;
    } else {
      const all = this.db.getTable('expenses').filter((e) => e.user_id === userId);
      const clients = this.db.getTable('clients');
      expenses = all.map((e) => ({
        ...e,
        client_name: e.client_id ? clients.find((c) => c.id === e.client_id)?.name || 'N/A' : '',
      }));
    }

    const headers = [
      { key: 'expense_date', label: 'Date' },
      { key: 'vendor', label: 'Vendor' },
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount' },
      { key: 'tax_amount', label: 'Tax Amount' },
      { key: 'is_tax_deductible', label: 'Tax Deductible' },
      { key: 'client_name', label: 'Client Linked' },
      { key: 'description', label: 'Description' },
    ];

    return this.csvService.toCsv(expenses, headers);
  }
}
