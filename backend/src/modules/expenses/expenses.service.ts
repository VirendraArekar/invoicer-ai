import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private db: DatabaseService) {}

  async findAll(userId: string, filter?: { category?: string; search?: string }) {
    if (this.db.isConnectedToPostgres) {
      let query = `
        SELECT e.*, c.name as client_name
        FROM expenses e
        LEFT JOIN clients c ON c.id = e.client_id
        WHERE e.user_id = $1
      `;
      const params: any[] = [userId];

      if (filter?.category && filter.category !== 'all') {
        params.push(filter.category);
        query += ` AND e.category = $${params.length}`;
      }

      if (filter?.search && filter.search.trim()) {
        params.push(`%${filter.search.trim()}%`);
        query += ` AND (e.vendor ILIKE $${params.length} OR e.description ILIKE $${params.length} OR e.category ILIKE $${params.length})`;
      }

      query += ` ORDER BY e.expense_date DESC, e.created_at DESC`;
      const res = await this.db.query(query, params);
      return res.rows;
    } else {
      let expenses = this.db.getTable('expenses').filter((e) => e.user_id === userId);
      const clients = this.db.getTable('clients');

      if (filter?.category && filter.category !== 'all') {
        expenses = expenses.filter((e) => e.category === filter.category);
      }

      let mapped = expenses.map((e) => {
        const client = clients.find((c) => c.id === e.client_id);
        return {
          ...e,
          client_name: client?.name || null,
        };
      });

      if (filter?.search && filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
        mapped = mapped.filter(
          (e) =>
            e.vendor?.toLowerCase().includes(q) ||
            e.description?.toLowerCase().includes(q) ||
            e.category?.toLowerCase().includes(q),
        );
      }

      return mapped.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
    }
  }

  async findOne(userId: string, id: string) {
    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(
        `SELECT e.*, c.name as client_name
         FROM expenses e
         LEFT JOIN clients c ON c.id = e.client_id
         WHERE e.id = $1 AND e.user_id = $2`,
        [id, userId],
      );
      if (res.rows.length === 0) throw new NotFoundException('Expense not found');
      return res.rows[0];
    } else {
      const exp = this.db.getTable('expenses').find((e) => e.id === id && e.user_id === userId);
      if (!exp) throw new NotFoundException('Expense not found');

      const client = exp.client_id ? this.db.getTable('clients').find((c) => c.id === exp.client_id) : null;
      return {
        ...exp,
        client_name: client?.name || null,
      };
    }
  }

  async create(userId: string, dto: CreateExpenseDto, receiptUrl?: string) {
    const id = 'exp_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newExpense = {
      id,
      user_id: userId,
      client_id: dto.clientId || null,
      category: dto.category,
      vendor: dto.vendor,
      amount: Number(dto.amount),
      tax_amount: Number(dto.taxAmount || 0),
      is_tax_deductible: dto.isTaxDeductible !== false,
      expense_date: dto.expenseDate,
      description: dto.description || '',
      receipt_url: receiptUrl || dto.receiptUrl || '',
      created_at: new Date(),
      updated_at: new Date(),
    };

    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(
        `INSERT INTO expenses (id, user_id, client_id, category, vendor, amount, tax_amount, is_tax_deductible, expense_date, description, receipt_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          newExpense.id,
          newExpense.user_id,
          newExpense.client_id,
          newExpense.category,
          newExpense.vendor,
          newExpense.amount,
          newExpense.tax_amount,
          newExpense.is_tax_deductible,
          newExpense.expense_date,
          newExpense.description,
          newExpense.receipt_url,
          newExpense.created_at,
          newExpense.updated_at,
        ],
      );
      return res.rows[0];
    } else {
      this.db.getTable('expenses').unshift(newExpense);
      return newExpense;
    }
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto, receiptUrl?: string) {
    await this.findOne(userId, id);

    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(
        `UPDATE expenses
         SET category = COALESCE($1, category),
             vendor = COALESCE($2, vendor),
             amount = COALESCE($3, amount),
             tax_amount = COALESCE($4, tax_amount),
             is_tax_deductible = COALESCE($5, is_tax_deductible),
             expense_date = COALESCE($6, expense_date),
             description = COALESCE($7, description),
             client_id = COALESCE($8, client_id),
             receipt_url = COALESCE($9, receipt_url),
             updated_at = NOW()
         WHERE id = $10 AND user_id = $11
         RETURNING *`,
        [
          dto.category,
          dto.vendor,
          dto.amount !== undefined ? Number(dto.amount) : null,
          dto.taxAmount !== undefined ? Number(dto.taxAmount) : null,
          dto.isTaxDeductible,
          dto.expenseDate,
          dto.description,
          dto.clientId,
          receiptUrl || dto.receiptUrl,
          id,
          userId,
        ],
      );
      return res.rows[0];
    } else {
      const expenses = this.db.getTable('expenses');
      const idx = expenses.findIndex((e) => e.id === id && e.user_id === userId);
      if (idx !== -1) {
        expenses[idx] = {
          ...expenses[idx],
          ...dto,
          amount: dto.amount !== undefined ? Number(dto.amount) : expenses[idx].amount,
          tax_amount: dto.taxAmount !== undefined ? Number(dto.taxAmount) : expenses[idx].tax_amount,
          receipt_url: receiptUrl || dto.receiptUrl || expenses[idx].receipt_url,
          updated_at: new Date(),
        };
        return expenses[idx];
      }
    }
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    if (this.db.isConnectedToPostgres) {
      await this.db.query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [id, userId]);
    } else {
      const expenses = this.db.getTable('expenses');
      const idx = expenses.findIndex((e) => e.id === id && e.user_id === userId);
      if (idx !== -1) expenses.splice(idx, 1);
    }
    return { success: true, message: 'Expense deleted successfully' };
  }
}
