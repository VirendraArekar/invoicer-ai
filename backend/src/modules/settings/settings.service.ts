import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private db: DatabaseService) {}

  async getSettings(userId: string) {
    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query('SELECT * FROM settings WHERE user_id = $1', [userId]);
      if (res.rows.length > 0) return res.rows[0];

      // Auto-create if missing
      const userRes = await this.db.query('SELECT * FROM users WHERE id = $1', [userId]);
      const user = userRes.rows[0];
      const newSettings = {
        id: 'set_' + userId,
        user_id: userId,
        company_name: user?.company_name || 'My Company',
        email: user?.email || '',
        phone: '',
        website: '',
        tax_id: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'United States',
        logo_url: '',
        default_currency: user?.currency || 'USD',
        default_tax_rate: 8.25,
        default_payment_terms: 'Net 30',
        invoice_notes_template: 'Thank you for your business. Remit payment within payment terms.',
      };
      await this.db.query(
        `INSERT INTO settings (id, user_id, company_name, email, default_currency, default_tax_rate, default_payment_terms, invoice_notes_template)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          newSettings.id,
          newSettings.user_id,
          newSettings.company_name,
          newSettings.email,
          newSettings.default_currency,
          newSettings.default_tax_rate,
          newSettings.default_payment_terms,
          newSettings.invoice_notes_template,
        ],
      );
      return newSettings;
    } else {
      let settings = this.db.getTable('settings').find((s) => s.user_id === userId);
      if (!settings) {
        const user = this.db.getTable('users').find((u) => u.id === userId);
        settings = {
          id: 'set_' + userId,
          user_id: userId,
          company_name: user?.company_name || 'My Company',
          email: user?.email || '',
          phone: '',
          website: '',
          tax_id: '',
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'United States',
          logo_url: '',
          default_currency: user?.currency || 'USD',
          default_tax_rate: 8.25,
          default_payment_terms: 'Net 30',
          invoice_notes_template: 'Thank you for your business. Remit payment within terms.',
          created_at: new Date(),
          updated_at: new Date(),
        };
        this.db.getTable('settings').push(settings);
      }
      return settings;
    }
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    await this.getSettings(userId);

    if (this.db.isConnectedToPostgres) {
      const res = await this.db.query(
        `UPDATE settings
         SET company_name = COALESCE($1, company_name),
             email = COALESCE($2, email),
             phone = COALESCE($3, phone),
             website = COALESCE($4, website),
             tax_id = COALESCE($5, tax_id),
             address_line1 = COALESCE($6, address_line1),
             address_line2 = COALESCE($7, address_line2),
             city = COALESCE($8, city),
             state = COALESCE($9, state),
             postal_code = COALESCE($10, postal_code),
             country = COALESCE($11, country),
             logo_url = COALESCE($12, logo_url),
             default_currency = COALESCE($13, default_currency),
             default_tax_rate = COALESCE($14, default_tax_rate),
             default_payment_terms = COALESCE($15, default_payment_terms),
             invoice_notes_template = COALESCE($16, invoice_notes_template),
             updated_at = NOW()
         WHERE user_id = $17
         RETURNING *`,
        [
          dto.companyName,
          dto.email,
          dto.phone,
          dto.website,
          dto.taxId,
          dto.addressLine1,
          dto.addressLine2,
          dto.city,
          dto.state,
          dto.postalCode,
          dto.country,
          dto.logoUrl,
          dto.defaultCurrency,
          dto.defaultTaxRate !== undefined ? Number(dto.defaultTaxRate) : null,
          dto.defaultPaymentTerms,
          dto.invoiceNotesTemplate,
          userId,
        ],
      );
      return res.rows[0];
    } else {
      const settingsList = this.db.getTable('settings');
      const idx = settingsList.findIndex((s) => s.user_id === userId);
      if (idx !== -1) {
        settingsList[idx] = {
          ...settingsList[idx],
          company_name: dto.companyName ?? settingsList[idx].company_name,
          email: dto.email ?? settingsList[idx].email,
          phone: dto.phone ?? settingsList[idx].phone,
          website: dto.website ?? settingsList[idx].website,
          tax_id: dto.taxId ?? settingsList[idx].tax_id,
          address_line1: dto.addressLine1 ?? settingsList[idx].address_line1,
          address_line2: dto.addressLine2 ?? settingsList[idx].address_line2,
          city: dto.city ?? settingsList[idx].city,
          state: dto.state ?? settingsList[idx].state,
          postal_code: dto.postalCode ?? settingsList[idx].postal_code,
          country: dto.country ?? settingsList[idx].country,
          logo_url: dto.logoUrl ?? settingsList[idx].logo_url,
          default_currency: dto.defaultCurrency ?? settingsList[idx].default_currency,
          default_tax_rate: dto.defaultTaxRate !== undefined ? Number(dto.defaultTaxRate) : settingsList[idx].default_tax_rate,
          default_payment_terms: dto.defaultPaymentTerms ?? settingsList[idx].default_payment_terms,
          invoice_notes_template: dto.invoiceNotesTemplate ?? settingsList[idx].invoice_notes_template,
          updated_at: new Date(),
        };
        return settingsList[idx];
      }
    }
  }
}
