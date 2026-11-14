import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/create-invoice.dto';
import { PdfService } from './pdf.service';

@Injectable()
export class InvoicesService {
  constructor(
    private db: DatabaseService,
    private pdfService: PdfService,
  ) {}

  async findAll(userId: string, filter?: { status?: string; clientId?: string; search?: string }) {
    if (this.db.isConnectedToPostgres) {
      let query = `
        SELECT i.*, 
               c.name AS client_name,
               c.email AS client_email,
               (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id) AS item_count
        FROM invoices i
        LEFT JOIN clients c ON c.id = i.client_id
        WHERE i.user_id = $1
      `;
      const params: any[] = [userId];

      if (filter?.status && filter.status !== 'all') {
        params.push(filter.status);
        query += ` AND i.status = $${params.length}`;
      }

      if (filter?.clientId) {
        params.push(filter.clientId);
        query += ` AND i.client_id = $${params.length}`;
      }

      if (filter?.search && filter.search.trim()) {
        params.push(`%${filter.search.trim()}%`);
        query += ` AND (i.invoice_number ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
      }

      query += ` ORDER BY i.created_at DESC`;
      const res = await this.db.query(query, params);
      return res.rows;
    } else {
      let invoices = this.db.getTable('invoices').filter((inv) => inv.user_id === userId);
      const clients = this.db.getTable('clients');
      const items = this.db.getTable('invoice_items');

      if (filter?.status && filter.status !== 'all') {
        invoices = invoices.filter((inv) => inv.status.toLowerCase() === filter.status?.toLowerCase());
      }

      if (filter?.clientId) {
        invoices = invoices.filter((inv) => inv.client_id === filter.clientId);
      }

      let mapped = invoices.map((inv) => {
        const client = clients.find((c) => c.id === inv.client_id);
        const invItems = items.filter((itm) => itm.invoice_id === inv.id);
        return {
          ...inv,
          client_name: client?.name || 'Unknown Client',
          client_email: client?.email || '',
          item_count: invItems.length,
        };
      });

      if (filter?.search && filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
        mapped = mapped.filter(
          (inv) =>
            inv.invoice_number?.toLowerCase().includes(q) ||
            inv.client_name?.toLowerCase().includes(q),
        );
      }

      return mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }

  async findOne(userId: string, id: string) {
    if (this.db.isConnectedToPostgres) {
      const invRes = await this.db.query(
        `SELECT i.*, 
                c.name AS client_name, c.email AS client_email, c.phone AS client_phone,
                c.address AS client_address, c.city AS client_city, c.state AS client_state,
                c.postal_code AS client_postal_code, c.country AS client_country, c.tax_number AS client_tax_number
         FROM invoices i
         LEFT JOIN clients c ON c.id = i.client_id
         WHERE i.id = $1 AND i.user_id = $2`,
        [id, userId],
      );

      if (invRes.rows.length === 0) throw new NotFoundException('Invoice not found');
      const invoice = invRes.rows[0];

      const itemsRes = await this.db.query(
        `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order ASC, id ASC`,
        [id],
      );

      const paymentsRes = await this.db.query(
        `SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC`,
        [id],
      );

      return {
        ...invoice,
        items: itemsRes.rows,
        payments: paymentsRes.rows,
      };
    } else {
      const invoice = this.db.getTable('invoices').find((inv) => inv.id === id && inv.user_id === userId);
      if (!invoice) throw new NotFoundException('Invoice not found');

      const client = this.db.getTable('clients').find((c) => c.id === invoice.client_id);
      const items = this.db
        .getTable('invoice_items')
        .filter((itm) => itm.invoice_id === id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      const payments = this.db
        .getTable('payments')
        .filter((p) => p.invoice_id === id)
        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

      return {
        ...invoice,
        client_name: client?.name,
        client_email: client?.email,
        client_phone: client?.phone,
        client_address: client?.address,
        client_city: client?.city,
        client_state: client?.state,
        client_postal_code: client?.postal_code,
        client_country: client?.country,
        client_tax_number: client?.tax_number,
        items,
        payments,
      };
    }
  }

  async getNextInvoiceNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear();
    let count = 1;

    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(`SELECT COUNT(*) FROM invoices WHERE user_id = $1`, [userId]);
      count = parseInt(res.rows[0].count, 10) + 1;
    } else {
      const userInvoices = this.db.getTable('invoices').filter((inv) => inv.user_id === userId);
      count = userInvoices.length + 1;
    }

    const pad = count.toString().padStart(3, '0');
    return `INV-${year}-${pad}`;
  }

  async create(userId: string, dto: CreateInvoiceDto) {
    const invoiceId = 'inv_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const invoiceNumber = dto.invoiceNumber || (await this.getNextInvoiceNumber(userId));

    // Calculate totals
    const { subtotal, discountAmount, taxAmount, totalAmount } = this.calculateTotals(
      dto.items,
      dto.taxRate ?? 0,
      dto.discountType || 'none',
      dto.discountValue ?? 0,
    );

    const newInvoice = {
      id: invoiceId,
      user_id: userId,
      client_id: dto.clientId,
      invoice_number: invoiceNumber,
      status: dto.status || 'draft',
      issue_date: dto.issueDate,
      due_date: dto.dueDate,
      subtotal,
      tax_rate: Number(dto.taxRate ?? 0),
      tax_amount: taxAmount,
      discount_type: dto.discountType || 'none',
      discount_value: Number(dto.discountValue ?? 0),
      discount_amount: discountAmount,
      total_amount: totalAmount,
      amount_paid: 0,
      balance_due: totalAmount,
      currency: dto.currency || 'USD',
      notes: dto.notes || '',
      terms: dto.terms || 'Net 30 Days',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const itemsToInsert = (dto.items || []).map((itm, index) => {
      const lineTotal = Number(itm.quantity || 1) * Number(itm.unitPrice || 0);
      return {
        id: 'itm_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6) + index,
        invoice_id: invoiceId,
        product_id: itm.productId || null,
        description: itm.description,
        quantity: Number(itm.quantity || 1),
        unit_price: Number(itm.unitPrice || 0),
        tax_rate: Number(itm.taxRate || 0),
        total: lineTotal,
        sort_order: index + 1,
      };
    });

    if (this.db.isConnectedToPostgres) {
      await this.db.query(
        `INSERT INTO invoices (id, user_id, client_id, invoice_number, status, issue_date, due_date, subtotal, tax_rate, tax_amount, discount_type, discount_value, discount_amount, total_amount, amount_paid, balance_due, currency, notes, terms, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          newInvoice.id,
          newInvoice.user_id,
          newInvoice.client_id,
          newInvoice.invoice_number,
          newInvoice.status,
          newInvoice.issue_date,
          newInvoice.due_date,
          newInvoice.subtotal,
          newInvoice.tax_rate,
          newInvoice.tax_amount,
          newInvoice.discount_type,
          newInvoice.discount_value,
          newInvoice.discount_amount,
          newInvoice.total_amount,
          newInvoice.amount_paid,
          newInvoice.balance_due,
          newInvoice.currency,
          newInvoice.notes,
          newInvoice.terms,
          newInvoice.created_at,
          newInvoice.updated_at,
        ],
      );

      for (const item of itemsToInsert) {
        await this.db.query(
          `INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, unit_price, tax_rate, total, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            item.id,
            item.invoice_id,
            item.product_id,
            item.description,
            item.quantity,
            item.unit_price,
            item.tax_rate,
            item.total,
            item.sort_order,
          ],
        );
      }
    } else {
      this.db.getTable('invoices').unshift(newInvoice);
      this.db.getTable('invoice_items').push(...itemsToInsert);
    }

    return this.findOne(userId, invoiceId);
  }

  async update(userId: string, id: string, dto: UpdateInvoiceDto) {
    const existing = await this.findOne(userId, id);

    const { subtotal, discountAmount, taxAmount, totalAmount } = this.calculateTotals(
      dto.items,
      dto.taxRate ?? existing.tax_rate,
      dto.discountType || existing.discount_type,
      dto.discountValue ?? existing.discount_value,
    );

    const amountPaid = Number(existing.amount_paid || 0);
    const balanceDue = Math.max(0, totalAmount - amountPaid);
    let status = dto.status || existing.status;
    if (amountPaid >= totalAmount && totalAmount > 0) {
      status = 'paid';
    } else if (amountPaid > 0 && balanceDue > 0) {
      status = 'partial';
    }

    if (this.db.isConnectedToPostgres) {
      await this.db.query(
        `UPDATE invoices
         SET client_id = COALESCE($1, client_id),
             issue_date = COALESCE($2, issue_date),
             due_date = COALESCE($3, due_date),
             subtotal = $4,
             tax_rate = $5,
             tax_amount = $6,
             discount_type = $7,
             discount_value = $8,
             discount_amount = $9,
             total_amount = $10,
             balance_due = $11,
             status = $12,
             currency = COALESCE($13, currency),
             notes = COALESCE($14, notes),
             terms = COALESCE($15, terms),
             updated_at = NOW()
         WHERE id = $16 AND user_id = $17`,
        [
          dto.clientId,
          dto.issueDate,
          dto.dueDate,
          subtotal,
          dto.taxRate ?? 0,
          taxAmount,
          dto.discountType || 'none',
          dto.discountValue ?? 0,
          discountAmount,
          totalAmount,
          balanceDue,
          status,
          dto.currency,
          dto.notes,
          dto.terms,
          id,
          userId,
        ],
      );

      // Re-create items
      await this.db.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
      for (let i = 0; i < (dto.items || []).length; i++) {
        const itm = dto.items[i];
        const lineTotal = Number(itm.quantity || 1) * Number(itm.unitPrice || 0);
        await this.db.query(
          `INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, unit_price, tax_rate, total, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            'itm_' + Date.now().toString(36) + i,
            id,
            itm.productId || null,
            itm.description,
            itm.quantity,
            itm.unitPrice,
            itm.taxRate || 0,
            lineTotal,
            i + 1,
          ],
        );
      }
    } else {
      const invoices = this.db.getTable('invoices');
      const idx = invoices.findIndex((inv) => inv.id === id && inv.user_id === userId);
      if (idx !== -1) {
        invoices[idx] = {
          ...invoices[idx],
          client_id: dto.clientId || invoices[idx].client_id,
          issue_date: dto.issueDate || invoices[idx].issue_date,
          due_date: dto.dueDate || invoices[idx].due_date,
          subtotal,
          tax_rate: Number(dto.taxRate ?? 0),
          tax_amount: taxAmount,
          discount_type: dto.discountType || 'none',
          discount_value: Number(dto.discountValue ?? 0),
          discount_amount: discountAmount,
          total_amount: totalAmount,
          balance_due: balanceDue,
          status,
          currency: dto.currency || invoices[idx].currency,
          notes: dto.notes !== undefined ? dto.notes : invoices[idx].notes,
          terms: dto.terms !== undefined ? dto.terms : invoices[idx].terms,
          updated_at: new Date(),
        };

        // Replace items
        let items = this.db.getTable('invoice_items');
        items = items.filter((itm) => itm.invoice_id !== id);
        const newItems = (dto.items || []).map((itm, i) => ({
          id: 'itm_' + Date.now().toString(36) + i,
          invoice_id: id,
          product_id: itm.productId || null,
          description: itm.description,
          quantity: Number(itm.quantity || 1),
          unit_price: Number(itm.unitPrice || 0),
          tax_rate: Number(itm.taxRate || 0),
          total: Number(itm.quantity || 1) * Number(itm.unitPrice || 0),
          sort_order: i + 1,
        }));
        items.push(...newItems);
        this.db.setTable('invoice_items', items);
      }
    }

    return this.findOne(userId, id);
  }

  async updateStatus(userId: string, id: string, status: string) {
    await this.findOne(userId, id);
    if (this.db.isConnectedToPostgres) {
      await this.db.query('UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3', [
        status,
        id,
        userId,
      ]);
    } else {
      const invoices = this.db.getTable('invoices');
      const inv = invoices.find((i) => i.id === id && i.user_id === userId);
      if (inv) inv.status = status;
    }
    return this.findOne(userId, id);
  }

  async duplicate(userId: string, id: string) {
    const original = await this.findOne(userId, id);
    const newNumber = await this.getNextInvoiceNumber(userId);

    const itemsDto = (original.items || []).map((itm: any) => ({
      description: itm.description,
      quantity: Number(itm.quantity),
      unitPrice: Number(itm.unit_price),
      taxRate: Number(itm.tax_rate),
      productId: itm.product_id,
    }));

    return this.create(userId, {
      clientId: original.client_id,
      invoiceNumber: newNumber,
      issueDate: new Date().toISOString().substring(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
      items: itemsDto,
      discountType: original.discount_type,
      discountValue: original.discount_value,
      taxRate: original.tax_rate,
      currency: original.currency,
      notes: original.notes,
      terms: original.terms,
      status: 'draft',
    });
  }

  async sendInvoiceEmail(userId: string, id: string) {
    const invoice = await this.findOne(userId, id);
    await this.updateStatus(userId, id, 'sent');
    return {
      success: true,
      message: `Invoice #${invoice.invoice_number} sent successfully to ${invoice.client_email || 'client'}!`,
      sentAt: new Date().toISOString(),
      recipient: invoice.client_email,
    };
  }

  async generatePdf(userId: string, id: string): Promise<Buffer> {
    const invoice = await this.findOne(userId, id);

    let client: any = null;
    let settings: any = null;

    if (this.db.isConnectedToPostgres) {
      const clRes = await this.db.query('SELECT * FROM clients WHERE id = $1', [invoice.client_id]);
      client = clRes.rows[0];
      const setRes = await this.db.query('SELECT * FROM settings WHERE user_id = $1', [userId]);
      settings = setRes.rows[0];
    } else {
      client = this.db.getTable('clients').find((c) => c.id === invoice.client_id);
      settings = this.db.getTable('settings').find((s) => s.user_id === userId);
    }

    return this.pdfService.generateInvoicePdf(invoice, client, settings);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    if (this.db.isConnectedToPostgres) {
      await this.db.query('DELETE FROM invoices WHERE id = $1 AND user_id = $2', [id, userId]);
    } else {
      const invoices = this.db.getTable('invoices');
      const idx = invoices.findIndex((i) => i.id === id && i.user_id === userId);
      if (idx !== -1) invoices.splice(idx, 1);
    }
    return { success: true, message: 'Invoice deleted successfully' };
  }

  private calculateTotals(
    items: any[] = [],
    taxRatePercent: number = 0,
    discountType: 'none' | 'percentage' | 'fixed' = 'none',
    discountValue: number = 0,
  ) {
    const subtotal = items.reduce((acc, itm) => {
      const qty = Number(itm.quantity || 1);
      const price = Number(itm.unitPrice || itm.unit_price || 0);
      return acc + qty * price;
    }, 0);

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * Number(discountValue || 0)) / 100;
    } else if (discountType === 'fixed') {
      discountAmount = Number(discountValue || 0);
    }
    discountAmount = Math.min(discountAmount, subtotal);

    const taxableBase = Math.max(0, subtotal - discountAmount);
    const taxAmount = (taxableBase * Number(taxRatePercent || 0)) / 100;
    const totalAmount = taxableBase + taxAmount;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
    };
  }
}
