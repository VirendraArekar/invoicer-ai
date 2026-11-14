import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateClientDto, UpdateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(private db: DatabaseService) {}

  async findAll(userId: string, search?: string) {
    if (this.db.isConnectedToPostgres) {
      let query = `
        SELECT c.*,
          COALESCE(COUNT(DISTINCT i.id), 0) AS total_invoices,
          COALESCE(SUM(i.total_amount), 0) AS total_billed,
          COALESCE(SUM(i.balance_due), 0) AS outstanding_balance
        FROM clients c
        LEFT JOIN invoices i ON i.client_id = c.id
        WHERE c.user_id = $1
      `;
      const params: any[] = [userId];

      if (search && search.trim()) {
        query += ` AND (c.name ILIKE $2 OR c.email ILIKE $2 OR c.tax_number ILIKE $2)`;
        params.push(`%${search.trim()}%`);
      }

      query += ` GROUP BY c.id ORDER BY c.created_at DESC`;

      const res = await this.db.query(query, params);
      return res.rows;
    } else {
      const clients = this.db.getTable('clients').filter((c) => c.user_id === userId);
      const invoices = this.db.getTable('invoices');

      let filtered = clients;
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.tax_number?.toLowerCase().includes(q),
        );
      }

      return filtered.map((c) => {
        const clientInvoices = invoices.filter((inv) => inv.client_id === c.id);
        const totalBilled = clientInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
        const outstanding = clientInvoices.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0);
        return {
          ...c,
          total_invoices: clientInvoices.length,
          total_billed: totalBilled,
          outstanding_balance: outstanding,
        };
      });
    }
  }

  async findOne(userId: string, clientId: string) {
    if (this.db.isConnectedToPostgres) {
      const clientRes = await this.db.query(
        'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
        [clientId, userId],
      );
      if (clientRes.rows.length === 0) {
        throw new NotFoundException('Client not found');
      }
      const client = clientRes.rows[0];

      const invoicesRes = await this.db.query(
        'SELECT * FROM invoices WHERE client_id = $1 AND user_id = $2 ORDER BY issue_date DESC',
        [clientId, userId],
      );

      return {
        ...client,
        invoices: invoicesRes.rows,
      };
    } else {
      const client = this.db.getTable('clients').find((c) => c.id === clientId && c.user_id === userId);
      if (!client) {
        throw new NotFoundException('Client not found');
      }
      const clientInvoices = this.db
        .getTable('invoices')
        .filter((inv) => inv.client_id === clientId && inv.user_id === userId);
      return {
        ...client,
        invoices: clientInvoices,
      };
    }
  }

  async create(userId: string, dto: CreateClientDto) {
    const id = 'cli_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newClient = {
      id,
      user_id: userId,
      name: dto.name,
      email: dto.email || null,
      phone: dto.phone || null,
      address: dto.address || null,
      city: dto.city || null,
      state: dto.state || null,
      postal_code: dto.postalCode || null,
      country: dto.country || 'United States',
      tax_number: dto.taxNumber || null,
      notes: dto.notes || null,
      status: dto.status || 'active',
      created_at: new Date(),
      updated_at: new Date(),
    };

    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(
        `INSERT INTO clients (id, user_id, name, email, phone, address, city, state, postal_code, country, tax_number, notes, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          newClient.id,
          newClient.user_id,
          newClient.name,
          newClient.email,
          newClient.phone,
          newClient.address,
          newClient.city,
          newClient.state,
          newClient.postal_code,
          newClient.country,
          newClient.tax_number,
          newClient.notes,
          newClient.status,
          newClient.created_at,
          newClient.updated_at,
        ],
      );
      return res.rows[0];
    } else {
      this.db.getTable('clients').unshift(newClient);
      return newClient;
    }
  }

  async update(userId: string, clientId: string, dto: UpdateClientDto) {
    await this.findOne(userId, clientId);

    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(
        `UPDATE clients
         SET name = COALESCE($1, name),
             email = COALESCE($2, email),
             phone = COALESCE($3, phone),
             address = COALESCE($4, address),
             city = COALESCE($5, city),
             state = COALESCE($6, state),
             postal_code = COALESCE($7, postal_code),
             country = COALESCE($8, country),
             tax_number = COALESCE($9, tax_number),
             notes = COALESCE($10, notes),
             status = COALESCE($11, status),
             updated_at = NOW()
         WHERE id = $12 AND user_id = $13
         RETURNING *`,
        [
          dto.name,
          dto.email,
          dto.phone,
          dto.address,
          dto.city,
          dto.state,
          dto.postalCode,
          dto.country,
          dto.taxNumber,
          dto.notes,
          dto.status,
          clientId,
          userId,
        ],
      );
      return res.rows[0];
    } else {
      const clients = this.db.getTable('clients');
      const idx = clients.findIndex((c) => c.id === clientId && c.user_id === userId);
      if (idx !== -1) {
        clients[idx] = {
          ...clients[idx],
          ...dto,
          postal_code: dto.postalCode !== undefined ? dto.postalCode : clients[idx].postal_code,
          tax_number: dto.taxNumber !== undefined ? dto.taxNumber : clients[idx].tax_number,
          updated_at: new Date(),
        };
        return clients[idx];
      }
    }
  }

  async remove(userId: string, clientId: string) {
    await this.findOne(userId, clientId);
    if (this.db.isConnectedToPostgres) {
      await this.db.query('DELETE FROM clients WHERE id = $1 AND user_id = $2', [clientId, userId]);
    } else {
      const clients = this.db.getTable('clients');
      const idx = clients.findIndex((c) => c.id === clientId && c.user_id === userId);
      if (idx !== -1) {
        clients.splice(idx, 1);
      }
    }
    return { success: true, message: 'Client removed successfully' };
  }
}
