import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config({ path: resolve(__dirname, '../../../.env') });

async function runStandaloneMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  const ssl = process.env.DATABASE_SSL === 'true';

  if (!databaseUrl || databaseUrl.includes('npg_password')) {
    console.log('❌ DATABASE_URL is not configured with valid credentials in .env.');
    console.log('   Please set your Neon PostgreSQL connection string:');
    console.log('   DATABASE_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require');
    process.exit(1);
  }

  console.log(`Connecting to PostgreSQL/Neon: ${databaseUrl.split('@')[1] || 'db'}`);
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const testRes = await pool.query('SELECT NOW() as current_time, version()');
    console.log(`✅ Connected successfully to PostgreSQL at: ${testRes.rows[0].current_time}`);
    console.log(`   Version: ${testRes.rows[0].version}`);

    console.log('Executing database migrations...');
    const schemaSql = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(32) DEFAULT 'owner',
        company_name VARCHAR(255),
        currency VARCHAR(10) DEFAULT 'USD',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(64),
        address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        postal_code VARCHAR(32),
        country VARCHAR(100) DEFAULT 'United States',
        tax_number VARCHAR(100),
        notes TEXT,
        status VARCHAR(32) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sku VARCHAR(64),
        unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        tax_rate NUMERIC(5, 2) DEFAULT 0,
        category VARCHAR(100) DEFAULT 'Services',
        unit VARCHAR(32) DEFAULT 'unit',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        client_id VARCHAR(64) REFERENCES clients(id) ON DELETE SET NULL,
        invoice_number VARCHAR(64) NOT NULL,
        status VARCHAR(32) DEFAULT 'draft',
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        subtotal NUMERIC(12, 2) DEFAULT 0,
        tax_rate NUMERIC(5, 2) DEFAULT 0,
        tax_amount NUMERIC(12, 2) DEFAULT 0,
        discount_type VARCHAR(16) DEFAULT 'percentage',
        discount_value NUMERIC(12, 2) DEFAULT 0,
        discount_amount NUMERIC(12, 2) DEFAULT 0,
        total_amount NUMERIC(12, 2) DEFAULT 0,
        amount_paid NUMERIC(12, 2) DEFAULT 0,
        balance_due NUMERIC(12, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        notes TEXT,
        terms TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS invoice_items (
        id VARCHAR(64) PRIMARY KEY,
        invoice_id VARCHAR(64) REFERENCES invoices(id) ON DELETE CASCADE,
        product_id VARCHAR(64),
        description TEXT NOT NULL,
        quantity NUMERIC(10, 2) DEFAULT 1,
        unit_price NUMERIC(12, 2) DEFAULT 0,
        tax_rate NUMERIC(5, 2) DEFAULT 0,
        total NUMERIC(12, 2) DEFAULT 0,
        sort_order INT DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        invoice_id VARCHAR(64) REFERENCES invoices(id) ON DELETE CASCADE,
        amount NUMERIC(12, 2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_method VARCHAR(64) DEFAULT 'Bank Transfer',
        transaction_reference VARCHAR(128),
        notes TEXT,
        receipt_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        client_id VARCHAR(64) REFERENCES clients(id) ON DELETE SET NULL,
        category VARCHAR(100) NOT NULL,
        vendor VARCHAR(255) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        tax_amount NUMERIC(12, 2) DEFAULT 0,
        is_tax_deductible BOOLEAN DEFAULT TRUE,
        expense_date DATE NOT NULL,
        description TEXT,
        receipt_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(64),
        website VARCHAR(255),
        tax_id VARCHAR(100),
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        postal_code VARCHAR(32),
        country VARCHAR(100),
        logo_url TEXT,
        default_currency VARCHAR(10) DEFAULT 'USD',
        default_tax_rate NUMERIC(5, 2) DEFAULT 10,
        default_payment_terms VARCHAR(64) DEFAULT 'Net 30',
        invoice_notes_template TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(schemaSql);
    console.log('✅ PostgreSQL / Neon schema migrations completed successfully!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

runStandaloneMigration();
