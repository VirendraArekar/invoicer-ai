import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class DashboardService {
  constructor(private db: DatabaseService) {}

  async getDashboardSummary(userId: string) {
    if (this.db.isConnectedToPostgres) {
      // Postgres queries
      const invStats = await this.db.query(
        `SELECT 
            COALESCE(SUM(total_amount), 0) AS total_billed,
            COALESCE(SUM(amount_paid), 0) AS total_paid,
            COALESCE(SUM(balance_due), 0) AS outstanding,
            COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE AND balance_due > 0 THEN balance_due ELSE 0 END), 0) AS overdue_amount,
            COUNT(*) AS total_invoices,
            COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_count,
            COUNT(CASE WHEN status = 'overdue' OR (due_date < CURRENT_DATE AND balance_due > 0) THEN 1 END) AS overdue_count,
            COUNT(CASE WHEN status = 'draft' THEN 1 END) AS draft_count,
            COUNT(CASE WHEN status = 'sent' OR status = 'partial' THEN 1 END) AS pending_count
         FROM invoices
         WHERE user_id = $1`,
        [userId],
      );

      const expStats = await this.db.query(
        `SELECT COALESCE(SUM(amount), 0) AS total_expenses,
                COALESCE(SUM(tax_amount), 0) AS total_tax_paid
         FROM expenses
         WHERE user_id = $1`,
        [userId],
      );

      const clientCount = await this.db.query(
        `SELECT COUNT(*) AS count FROM clients WHERE user_id = $1`,
        [userId],
      );

      const recentInvoices = await this.db.query(
        `SELECT i.*, c.name as client_name
         FROM invoices i
         LEFT JOIN clients c ON c.id = i.client_id
         WHERE i.user_id = $1
         ORDER BY i.created_at DESC
         LIMIT 5`,
        [userId],
      );

      const recentPayments = await this.db.query(
        `SELECT p.*, i.invoice_number, c.name as client_name
         FROM payments p
         JOIN invoices i ON i.id = p.invoice_id
         LEFT JOIN clients c ON c.id = i.client_id
         WHERE p.user_id = $1
         ORDER BY p.payment_date DESC, p.created_at DESC
         LIMIT 5`,
        [userId],
      );

      const billed = Number(invStats.rows[0].total_billed);
      const revenue = Number(invStats.rows[0].total_paid);
      const outstanding = Number(invStats.rows[0].outstanding);
      const overdue = Number(invStats.rows[0].overdue_amount);
      const expenses = Number(expStats.rows[0].total_expenses);
      const netProfit = Number((revenue - expenses).toFixed(2));

      return {
        metrics: {
          totalRevenue: revenue,
          totalBilled: billed,
          outstandingBalance: outstanding,
          overdueAmount: overdue,
          totalExpenses: expenses,
          netProfit,
          profitMargin: revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(1)) : 0,
          totalClients: parseInt(clientCount.rows[0].count, 10),
          invoices: {
            total: parseInt(invStats.rows[0].total_invoices, 10),
            paid: parseInt(invStats.rows[0].paid_count, 10),
            overdue: parseInt(invStats.rows[0].overdue_count, 10),
            pending: parseInt(invStats.rows[0].pending_count, 10),
            draft: parseInt(invStats.rows[0].draft_count, 10),
          },
        },
        monthlyTrends: this.getMockMonthlyTrends(revenue, expenses),
        recentInvoices: recentInvoices.rows,
        recentPayments: recentPayments.rows,
        aiPulse: this.calculateAiPulse(revenue, expenses, outstanding, overdue),
      };
    } else {
      // Memory Store calculations
      const invoices = this.db.getTable('invoices').filter((inv) => inv.user_id === userId);
      const payments = this.db.getTable('payments').filter((p) => p.user_id === userId);
      const expenses = this.db.getTable('expenses').filter((e) => e.user_id === userId);
      const clients = this.db.getTable('clients').filter((c) => c.user_id === userId);

      const now = new Date();
      let totalBilled = 0;
      let totalPaid = 0;
      let outstanding = 0;
      let overdueAmount = 0;

      let paidCount = 0;
      let overdueCount = 0;
      let pendingCount = 0;
      let draftCount = 0;

      for (const inv of invoices) {
        const total = Number(inv.total_amount || 0);
        const paid = Number(inv.amount_paid || 0);
        const due = Number(inv.balance_due || 0);
        const isOverdue = new Date(inv.due_date) < now && due > 0;

        totalBilled += total;
        totalPaid += paid;
        outstanding += due;

        if (isOverdue) {
          overdueAmount += due;
          overdueCount++;
        } else if (inv.status === 'paid' || due <= 0) {
          paidCount++;
        } else if (inv.status === 'draft') {
          draftCount++;
        } else {
          pendingCount++;
        }
      }

      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const netProfit = Number((totalPaid - totalExpenses).toFixed(2));

      const recentInvoices = invoices.slice(0, 5).map((inv) => {
        const client = clients.find((c) => c.id === inv.client_id);
        return {
          ...inv,
          client_name: client?.name || 'N/A',
        };
      });

      const recentPayments = payments.slice(0, 5).map((p) => {
        const inv = invoices.find((i) => i.id === p.invoice_id);
        const client = inv ? clients.find((c) => c.id === inv.client_id) : null;
        return {
          ...p,
          invoice_number: inv?.invoice_number || 'N/A',
          client_name: client?.name || 'N/A',
        };
      });

      return {
        metrics: {
          totalRevenue: totalPaid,
          totalBilled,
          outstandingBalance: outstanding,
          overdueAmount,
          totalExpenses,
          netProfit,
          profitMargin: totalPaid > 0 ? Number(((netProfit / totalPaid) * 100).toFixed(1)) : 0,
          totalClients: clients.length,
          invoices: {
            total: invoices.length,
            paid: paidCount,
            overdue: overdueCount,
            pending: pendingCount,
            draft: draftCount,
          },
        },
        monthlyTrends: this.getMockMonthlyTrends(totalPaid, totalExpenses),
        recentInvoices,
        recentPayments,
        aiPulse: this.calculateAiPulse(totalPaid, totalExpenses, outstanding, overdueAmount),
      };
    }
  }

  private getMockMonthlyTrends(revenue: number, expenses: number) {
    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    return [
      { month: 'Jun', revenue: 4200, expenses: 1800, profit: 2400 },
      { month: 'Jul', revenue: 5800, expenses: 2100, profit: 3700 },
      { month: 'Aug', revenue: 7400, expenses: 2600, profit: 4800 },
      { month: 'Sep', revenue: 8900, expenses: 3100, profit: 5800 },
      { month: 'Oct', revenue: 10335, expenses: 3950, profit: 6385 },
      { month: 'Nov', revenue: revenue || 8500, expenses: expenses || 3600, profit: (revenue || 8500) - (expenses || 3600) },
    ];
  }

  private calculateAiPulse(revenue: number, expenses: number, outstanding: number, overdue: number) {
    const healthScore = Math.max(30, Math.min(96, Math.round(75 + (revenue > expenses ? 15 : -15) - (overdue > 0 ? 10 : 0))));
    return {
      healthScore,
      status: healthScore > 80 ? 'Optimal Growth' : healthScore > 65 ? 'Stable' : 'Attention Needed',
      summary:
        overdue > 0
          ? `Cash flow is solid, but \$${overdue.toLocaleString()} in overdue accounts requires immediate automated follow-up.`
          : 'Healthy operating margins with strong receivables collection velocity.',
      runwayMonths: expenses > 0 ? Number(((revenue * 2.5) / expenses).toFixed(1)) : 12,
      recommendation:
        'Trigger AI late-payment reminders for overdue invoices to accelerate capital collection by ~42%.',
    };
  }
}
