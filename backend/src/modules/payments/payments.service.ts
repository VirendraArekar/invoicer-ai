import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private db: DatabaseService) {}

  async findAll(userId: string) {
    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(
        `SELECT p.*, 
                i.invoice_number, 
                i.currency,
                c.name as client_name
         FROM payments p
         JOIN invoices i ON i.id = p.invoice_id
         LEFT JOIN clients c ON c.id = i.client_id
         WHERE p.user_id = $1
         ORDER BY p.payment_date DESC, p.created_at DESC`,
        [userId],
      );
      return res.rows;
    } else {
      const payments = this.db.getTable('payments').filter((p) => p.user_id === userId);
      const invoices = this.db.getTable('invoices');
      const clients = this.db.getTable('clients');

      return payments
        .map((p) => {
          const inv = invoices.find((i) => i.id === p.invoice_id);
          const client = inv ? clients.find((c) => c.id === inv.client_id) : null;
          return {
            ...p,
            invoice_number: inv?.invoice_number || 'N/A',
            currency: inv?.currency || 'USD',
            client_name: client?.name || 'N/A',
          };
        })
        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
    }
  }

  async findOne(userId: string, id: string) {
    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(
        `SELECT p.*, i.invoice_number, i.currency, c.name as client_name
         FROM payments p
         JOIN invoices i ON i.id = p.invoice_id
         LEFT JOIN clients c ON c.id = i.client_id
         WHERE p.id = $1 AND p.user_id = $2`,
        [id, userId],
      );
      if (res.rows.length === 0) throw new NotFoundException('Payment not found');
      return res.rows[0];
    } else {
      const p = this.db.getTable('payments').find((pay) => pay.id === id && pay.user_id === userId);
      if (!p) throw new NotFoundException('Payment not found');

      const inv = this.db.getTable('invoices').find((i) => i.id === p.invoice_id);
      const client = inv ? this.db.getTable('clients').find((c) => c.id === inv.client_id) : null;

      return {
        ...p,
        invoice_number: inv?.invoice_number,
        currency: inv?.currency,
        client_name: client?.name,
      };
    }
  }

  async record(userId: string, dto: RecordPaymentDto) {
    let invoice: any = null;

    if (this.db.isConnectedToPostgres) {
      const invRes = await this.db.query('SELECT * FROM invoices WHERE id = $1 AND user_id = $2', [
        dto.invoiceId,
        userId,
      ]);
      if (invRes.rows.length === 0) throw new NotFoundException('Invoice not found');
      invoice = invRes.rows[0];
    } else {
      invoice = this.db.getTable('invoices').find((i) => i.id === dto.invoiceId && i.user_id === userId);
      if (!invoice) throw new NotFoundException('Invoice not found');
    }

    const currentPaid = Number(invoice.amount_paid || 0);
    const totalAmount = Number(invoice.total_amount || 0);
    const paymentAmount = Number(dto.amount);

    if (paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const newAmountPaid = Number((currentPaid + paymentAmount).toFixed(2));
    const newBalanceDue = Math.max(0, Number((totalAmount - newAmountPaid).toFixed(2)));
    const newStatus = newBalanceDue <= 0 ? 'paid' : 'partial';

    const paymentId = 'pay_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newPayment = {
      id: paymentId,
      user_id: userId,
      invoice_id: dto.invoiceId,
      amount: paymentAmount,
      payment_date: dto.paymentDate,
      payment_method: dto.paymentMethod || 'Bank Transfer',
      transaction_reference: dto.transactionReference || '',
      notes: dto.notes || '',
      receipt_url: '',
      created_at: new Date(),
    };

    if (this.db.isConnectedToPostgres) {
      await this.db.query(
        `INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, transaction_reference, notes, receipt_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          newPayment.id,
          newPayment.user_id,
          newPayment.invoice_id,
          newPayment.amount,
          newPayment.payment_date,
          newPayment.payment_method,
          newPayment.transaction_reference,
          newPayment.notes,
          newPayment.receipt_url,
          newPayment.created_at,
        ],
      );

      await this.db.query(
        `UPDATE invoices 
         SET amount_paid = $1, balance_due = $2, status = $3, updated_at = NOW()
         WHERE id = $4 AND user_id = $5`,
        [newAmountPaid, newBalanceDue, newStatus, dto.invoiceId, userId],
      );
    } else {
      this.db.getTable('payments').unshift(newPayment);
      invoice.amount_paid = newAmountPaid;
      invoice.balance_due = newBalanceDue;
      invoice.status = newStatus;
      invoice.updated_at = new Date();
    }

    return this.findOne(userId, paymentId);
  }

  async remove(userId: string, id: string) {
    const payment = await this.findOne(userId, id);
    const invoiceId = payment.invoice_id;
    const amount = Number(payment.amount);

    if (this.db.isConnectedToPostgres) {
      await this.db.query('DELETE FROM payments WHERE id = $1 AND user_id = $2', [id, userId]);

      const invRes = await this.db.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
      if (invRes.rows.length > 0) {
        const inv = invRes.rows[0];
        const newPaid = Math.max(0, Number(inv.amount_paid) - amount);
        const newBalance = Number(inv.total_amount) - newPaid;
        const newStatus = newPaid <= 0 ? 'sent' : newBalance <= 0 ? 'paid' : 'partial';

        await this.db.query(
          'UPDATE invoices SET amount_paid = $1, balance_due = $2, status = $3, updated_at = NOW() WHERE id = $4',
          [newPaid, newBalance, newStatus, invoiceId],
        );
      }
    } else {
      const payments = this.db.getTable('payments');
      const idx = payments.findIndex((p) => p.id === id && p.user_id === userId);
      if (idx !== -1) payments.splice(idx, 1);

      const inv = this.db.getTable('invoices').find((i) => i.id === invoiceId);
      if (inv) {
        inv.amount_paid = Math.max(0, Number(inv.amount_paid) - amount);
        inv.balance_due = Number(inv.total_amount) - inv.amount_paid;
        inv.status = inv.amount_paid <= 0 ? 'sent' : inv.balance_due <= 0 ? 'paid' : 'partial';
      }
    }

    return { success: true, message: 'Payment recorded removed and invoice balance restored.' };
  }
}
