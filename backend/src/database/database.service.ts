import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult } from 'pg';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;
  public isConnectedToPostgres = false;

  // In-memory persistent fallback store if Postgres is unreachable
  private memoryStore: Record<string, any[]> = {
    users: [],
    clients: [],
    products: [],
    invoices: [],
    invoice_items: [],
    payments: [],
    expenses: [],
    settings: [],
  };

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initDatabase();
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('PostgreSQL connection pool closed');
    }
  }

  private async initDatabase() {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    const ssl = this.configService.get<string>('DATABASE_SSL') === 'true';

    if (databaseUrl && databaseUrl.trim().length > 0 && !databaseUrl.includes('npg_password')) {
      try {
        this.logger.log(`Attempting to connect to PostgreSQL / Neon: ${databaseUrl.split('@')[1] || 'db'}`);
        this.pool = new Pool({
          connectionString: databaseUrl,
          ssl: ssl ? { rejectUnauthorized: false } : undefined,
          connectionTimeoutMillis: 5000,
        });

        // Test connection
        const client = await this.pool.connect();
        const res = await client.query('SELECT NOW() as current_time');
        client.release();

        this.isConnectedToPostgres = true;
        this.logger.log(`Connected to PostgreSQL successfully at ${res.rows[0].current_time}`);
        await this.runMigrations();
        await this.seedInitialData();
        return;
      } catch (err: any) {
        this.logger.warn(
          `Could not connect to PostgreSQL (${err.message}). Activating built-in resilient database mode with instant demo dataset.`,
        );
        this.isConnectedToPostgres = false;
        this.pool = null;
      }
    } else {
      this.logger.log('No valid DATABASE_URL provided. Running with built-in resilient data engine.');
    }

    // Initialize mock store with rich demo data
    await this.seedMemoryStore();
  }

  private async runMigrations() {
    if (!this.pool) return;
    this.logger.log('Running PostgreSQL table migrations...');

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

    try {
      await this.pool.query(schemaSql);
      this.logger.log('PostgreSQL schema migration completed successfully');
    } catch (e: any) {
      this.logger.error(`Migration error: ${e.message}`);
    }
  }

  // Execute raw SQL query on PG Pool if available, or throw
  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (this.pool && this.isConnectedToPostgres) {
      return this.pool.query(text, params);
    }
    throw new Error('PostgreSQL pool not active');
  }

  // Generic Memory Store Accessors for fallback mode
  getTable(tableName: string): any[] {
    if (!this.memoryStore[tableName]) {
      this.memoryStore[tableName] = [];
    }
    return this.memoryStore[tableName];
  }

  setTable(tableName: string, data: any[]) {
    this.memoryStore[tableName] = data;
  }

  private async seedMemoryStore() {
    this.logger.log('Seeding demo data into resilient store...');
    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash('password123', salt);

    const demoUser = {
      id: 'usr_demo_01',
      email: 'demo@invoicerai.com',
      password_hash: demoPasswordHash,
      name: 'Alex Rivera',
      role: 'owner',
      company_name: 'Nexus Cloud Technologies Inc.',
      currency: 'USD',
      created_at: new Date('2026-01-15T00:00:00Z'),
      updated_at: new Date('2026-01-15T00:00:00Z'),
    };

    const demoSettings = {
      id: 'set_demo_01',
      user_id: 'usr_demo_01',
      company_name: 'Nexus Cloud Technologies Inc.',
      email: 'billing@nexuscloud.io',
      phone: '+1 (555) 234-5678',
      website: 'https://nexuscloud.io',
      tax_id: 'US-849203918-TX',
      address_line1: '100 Innovation Way, Suite 400',
      address_line2: 'Floor 4',
      city: 'Austin',
      state: 'TX',
      postal_code: '78701',
      country: 'United States',
      logo_url: '',
      default_currency: 'USD',
      default_tax_rate: 8.25,
      default_payment_terms: 'Net 30',
      invoice_notes_template: 'Thank you for partnering with Nexus Cloud Technologies. Please remit payment via ACH or card.',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const demoClients = [
      {
        id: 'cli_01',
        user_id: 'usr_demo_01',
        name: 'Acme Global Ventures',
        email: 'accounts@acmeglobal.com',
        phone: '+1 (415) 890-1234',
        address: '500 Market St, Floor 12',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94105',
        country: 'United States',
        tax_number: 'US-92830192',
        notes: 'Enterprise account. 15-day payment cycle.',
        status: 'active',
        created_at: new Date('2026-02-01'),
        updated_at: new Date('2026-02-01'),
      },
      {
        id: 'cli_02',
        user_id: 'usr_demo_01',
        name: 'Starlight Media Studios',
        email: 'finance@starlightmedia.co',
        phone: '+1 (212) 555-8910',
        address: '770 Broadway',
        city: 'New York',
        state: 'NY',
        postal_code: '10003',
        country: 'United States',
        tax_number: 'US-10293847',
        notes: 'Monthly retainer client.',
        status: 'active',
        created_at: new Date('2026-02-10'),
        updated_at: new Date('2026-02-10'),
      },
      {
        id: 'cli_03',
        user_id: 'usr_demo_01',
        name: 'Apex BioDynamics Ltd',
        email: 'invoicing@apexbio.org',
        phone: '+44 20 7946 0912',
        address: '22 Bishopsgate',
        city: 'London',
        state: 'Greater London',
        postal_code: 'EC2N 4BQ',
        country: 'United Kingdom',
        tax_number: 'GB-99201920',
        notes: 'International client. VAT exempt export.',
        status: 'active',
        created_at: new Date('2026-03-01'),
        updated_at: new Date('2026-03-01'),
      },
      {
        id: 'cli_04',
        user_id: 'usr_demo_01',
        name: 'Vortex Robotics',
        email: 'billing@vortexrobotics.ai',
        phone: '+1 (206) 555-0144',
        address: '400 Pine Street',
        city: 'Seattle',
        state: 'WA',
        postal_code: '98101',
        country: 'United States',
        tax_number: 'US-87654321',
        notes: 'Hardware & AI integration consulting.',
        status: 'active',
        created_at: new Date('2026-03-15'),
        updated_at: new Date('2026-03-15'),
      },
    ];

    const demoProducts = [
      {
        id: 'prd_01',
        user_id: 'usr_demo_01',
        name: 'AI Cloud Infrastructure Setup',
        description: 'End-to-end Terraform & Kubernetes cluster setup with auto-scaling inference endpoints.',
        sku: 'SRV-AI-INFRA',
        unit_price: 4500.0,
        tax_rate: 8.25,
        category: 'Consulting',
        unit: 'project',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'prd_02',
        user_id: 'usr_demo_01',
        name: 'Senior Full-Stack AI Engineering',
        description: 'Custom React/NestJS architecture, Gemini API integration, and performance tuning.',
        sku: 'DEV-SR-HOURLY',
        unit_price: 160.0,
        tax_rate: 8.25,
        category: 'Development',
        unit: 'hour',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'prd_03',
        user_id: 'usr_demo_01',
        name: 'Monthly DevOps & Security Retainer',
        description: '24/7 incident response, CI/CD pipelines, automated backups, and SOC2 compliance monitoring.',
        sku: 'RET-MNT-OPS',
        unit_price: 2800.0,
        tax_rate: 8.25,
        category: 'Retainer',
        unit: 'month',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'prd_04',
        user_id: 'usr_demo_01',
        name: 'UX/UI Product Design Sprint',
        description: 'Figma design system, high-fidelity prototypes, user testing, and component specs.',
        sku: 'DSG-SPRINT',
        unit_price: 3200.0,
        tax_rate: 8.25,
        category: 'Design',
        unit: 'sprint',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const demoInvoices = [
      {
        id: 'inv_01',
        user_id: 'usr_demo_01',
        client_id: 'cli_01',
        invoice_number: 'INV-2026-001',
        status: 'paid',
        issue_date: '2026-10-01',
        due_date: '2026-10-15',
        subtotal: 7700.0,
        tax_rate: 8.25,
        tax_amount: 635.25,
        discount_type: 'none',
        discount_value: 0,
        discount_amount: 0,
        total_amount: 8335.25,
        amount_paid: 8335.25,
        balance_due: 0,
        currency: 'USD',
        notes: 'Initial milestone delivered and accepted by engineering team.',
        terms: 'Net 15 Days',
        created_at: new Date('2026-10-01T10:00:00Z'),
        updated_at: new Date('2026-10-10T14:30:00Z'),
      },
      {
        id: 'inv_02',
        user_id: 'usr_demo_01',
        client_id: 'cli_02',
        invoice_number: 'INV-2026-002',
        status: 'sent',
        issue_date: '2026-10-25',
        due_date: '2026-11-25',
        subtotal: 5600.0,
        tax_rate: 8.25,
        tax_amount: 462.0,
        discount_type: 'percentage',
        discount_value: 5,
        discount_amount: 280.0,
        total_amount: 5782.0,
        amount_paid: 2000.0,
        balance_due: 3782.0,
        currency: 'USD',
        notes: 'Monthly retainer + 15 hours overflow development.',
        terms: 'Net 30 Days',
        created_at: new Date('2026-10-25T11:00:00Z'),
        updated_at: new Date('2026-11-01T09:00:00Z'),
      },
      {
        id: 'inv_03',
        user_id: 'usr_demo_01',
        client_id: 'cli_03',
        invoice_number: 'INV-2026-003',
        status: 'overdue',
        issue_date: '2026-10-05',
        due_date: '2026-11-05',
        subtotal: 9500.0,
        tax_rate: 0.0,
        tax_amount: 0.0,
        discount_type: 'none',
        discount_value: 0,
        discount_amount: 0,
        total_amount: 9500.0,
        amount_paid: 0.0,
        balance_due: 9500.0,
        currency: 'USD',
        notes: 'BioDynamics pipeline architecture & model training orchestration.',
        terms: 'Net 30 Days',
        created_at: new Date('2026-10-05T12:00:00Z'),
        updated_at: new Date('2026-11-06T08:00:00Z'),
      },
      {
        id: 'inv_04',
        user_id: 'usr_demo_01',
        client_id: 'cli_04',
        invoice_number: 'INV-2026-004',
        status: 'draft',
        issue_date: '2026-11-12',
        due_date: '2026-12-12',
        subtotal: 4800.0,
        tax_rate: 8.25,
        tax_amount: 396.0,
        discount_type: 'fixed',
        discount_value: 200,
        discount_amount: 200.0,
        total_amount: 4996.0,
        amount_paid: 0.0,
        balance_due: 4996.0,
        currency: 'USD',
        notes: 'Robotics telemetry dashboard development.',
        terms: 'Net 30 Days',
        created_at: new Date('2026-11-12T15:00:00Z'),
        updated_at: new Date('2026-11-12T15:00:00Z'),
      },
    ];

    const demoItems = [
      {
        id: 'itm_01',
        invoice_id: 'inv_01',
        product_id: 'prd_01',
        description: 'AI Cloud Infrastructure Setup on AWS with EKS & GPU worker nodes',
        quantity: 1,
        unit_price: 4500.0,
        tax_rate: 8.25,
        total: 4500.0,
        sort_order: 1,
      },
      {
        id: 'itm_02',
        invoice_id: 'inv_01',
        product_id: 'prd_02',
        description: 'Senior Full-Stack AI Engineering - Backend pipeline development (20 hrs)',
        quantity: 20,
        unit_price: 160.0,
        tax_rate: 8.25,
        total: 3200.0,
        sort_order: 2,
      },
      {
        id: 'itm_03',
        invoice_id: 'inv_02',
        product_id: 'prd_03',
        description: 'Monthly DevOps & Security Retainer - November 2026',
        quantity: 2,
        unit_price: 2800.0,
        tax_rate: 8.25,
        total: 5600.0,
        sort_order: 1,
      },
      {
        id: 'itm_04',
        invoice_id: 'inv_03',
        product_id: 'prd_01',
        description: 'High-throughput inference cluster design and deployment',
        quantity: 1,
        unit_price: 6300.0,
        tax_rate: 0,
        total: 6300.0,
        sort_order: 1,
      },
      {
        id: 'itm_05',
        invoice_id: 'inv_03',
        product_id: 'prd_02',
        description: 'Custom fine-tuning & prompt orchestration pipelines (20 hrs)',
        quantity: 20,
        unit_price: 160.0,
        tax_rate: 0,
        total: 3200.0,
        sort_order: 2,
      },
      {
        id: 'itm_06',
        invoice_id: 'inv_04',
        product_id: 'prd_04',
        description: 'UX/UI Product Design Sprint - Robot Fleet Control Interface',
        quantity: 1.5,
        unit_price: 3200.0,
        tax_rate: 8.25,
        total: 4800.0,
        sort_order: 1,
      },
    ];

    const demoPayments = [
      {
        id: 'pay_01',
        user_id: 'usr_demo_01',
        invoice_id: 'inv_01',
        amount: 8335.25,
        payment_date: '2026-10-10',
        payment_method: 'Bank Transfer (ACH)',
        transaction_reference: 'ACH-9948201',
        notes: 'Full payment received directly to operating account.',
        receipt_url: '',
        created_at: new Date('2026-10-10T14:30:00Z'),
      },
      {
        id: 'pay_02',
        user_id: 'usr_demo_01',
        invoice_id: 'inv_02',
        amount: 2000.0,
        payment_date: '2026-11-01',
        payment_method: 'Stripe / Credit Card',
        transaction_reference: 'ch_3N82b9K1',
        notes: 'Partial advance retainer payment.',
        receipt_url: '',
        created_at: new Date('2026-11-01T09:00:00Z'),
      },
    ];

    const demoExpenses = [
      {
        id: 'exp_01',
        user_id: 'usr_demo_01',
        client_id: 'cli_01',
        category: 'Software & Cloud',
        vendor: 'Amazon Web Services',
        amount: 1420.5,
        tax_amount: 117.19,
        is_tax_deductible: true,
        expense_date: '2026-10-15',
        description: 'GPU cluster staging & load testing compute',
        receipt_url: '',
        created_at: new Date('2026-10-15'),
        updated_at: new Date('2026-10-15'),
      },
      {
        id: 'exp_02',
        user_id: 'usr_demo_01',
        client_id: null,
        category: 'Software & Cloud',
        vendor: 'Google Cloud Platform (Gemini API)',
        amount: 380.0,
        tax_amount: 0,
        is_tax_deductible: true,
        expense_date: '2026-10-28',
        description: 'Gemini reasoning and inference API usage for SaaS pipelines',
        receipt_url: '',
        created_at: new Date('2026-10-28'),
        updated_at: new Date('2026-10-28'),
      },
      {
        id: 'exp_03',
        user_id: 'usr_demo_01',
        client_id: null,
        category: 'Office & Workspace',
        vendor: 'WeWork Austin',
        amount: 850.0,
        tax_amount: 70.12,
        is_tax_deductible: true,
        expense_date: '2026-11-01',
        description: 'Dedicated team studio rent',
        receipt_url: '',
        created_at: new Date('2026-11-01'),
        updated_at: new Date('2026-11-01'),
      },
      {
        id: 'exp_04',
        user_id: 'usr_demo_01',
        client_id: null,
        category: 'Hardware & Gear',
        vendor: 'Apple Store',
        amount: 2499.0,
        tax_amount: 206.17,
        is_tax_deductible: true,
        expense_date: '2026-11-04',
        description: 'MacBook Pro M3 Max workstation for AI dev lead',
        receipt_url: '',
        created_at: new Date('2026-11-04'),
        updated_at: new Date('2026-11-04'),
      },
    ];

    this.memoryStore.users = [demoUser];
    this.memoryStore.settings = [demoSettings];
    this.memoryStore.clients = demoClients;
    this.memoryStore.products = demoProducts;
    this.memoryStore.invoices = demoInvoices;
    this.memoryStore.invoice_items = demoItems;
    this.memoryStore.payments = demoPayments;
    this.memoryStore.expenses = demoExpenses;

    this.logger.log('Demo dataset successfully populated into store.');
  }

  private async seedInitialData() {
    if (!this.pool) return;
    try {
      const userCheck = await this.pool.query('SELECT count(*) FROM users');
      if (parseInt(userCheck.rows[0].count, 10) === 0) {
        this.logger.log('Seeding initial PostgreSQL records...');
        await this.seedMemoryStore();
        // Insert demo records from memory store into PostgreSQL
        for (const u of this.memoryStore.users) {
          await this.pool.query(
            `INSERT INTO users (id, email, password_hash, name, role, company_name, currency, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING`,
            [u.id, u.email, u.password_hash, u.name, u.role, u.company_name, u.currency, u.created_at, u.updated_at],
          );
        }
        for (const s of this.memoryStore.settings) {
          await this.pool.query(
            `INSERT INTO settings (id, user_id, company_name, email, phone, website, tax_id, address_line1, address_line2, city, state, postal_code, country, logo_url, default_currency, default_tax_rate, default_payment_terms, invoice_notes_template)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) ON CONFLICT DO NOTHING`,
            [s.id, s.user_id, s.company_name, s.email, s.phone, s.website, s.tax_id, s.address_line1, s.address_line2, s.city, s.state, s.postal_code, s.country, s.logo_url, s.default_currency, s.default_tax_rate, s.default_payment_terms, s.invoice_notes_template],
          );
        }
        for (const c of this.memoryStore.clients) {
          await this.pool.query(
            `INSERT INTO clients (id, user_id, name, email, phone, address, city, state, postal_code, country, tax_number, notes, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) ON CONFLICT DO NOTHING`,
            [c.id, c.user_id, c.name, c.email, c.phone, c.address, c.city, c.state, c.postal_code, c.country, c.tax_number, c.notes, c.status, c.created_at, c.updated_at],
          );
        }
        for (const p of this.memoryStore.products) {
          await this.pool.query(
            `INSERT INTO products (id, user_id, name, description, sku, unit_price, tax_rate, category, unit, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT DO NOTHING`,
            [p.id, p.user_id, p.name, p.description, p.sku, p.unit_price, p.tax_rate, p.category, p.unit, p.is_active, p.created_at, p.updated_at],
          );
        }
        for (const inv of this.memoryStore.invoices) {
          await this.pool.query(
            `INSERT INTO invoices (id, user_id, client_id, invoice_number, status, issue_date, due_date, subtotal, tax_rate, tax_amount, discount_type, discount_value, discount_amount, total_amount, amount_paid, balance_due, currency, notes, terms, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) ON CONFLICT DO NOTHING`,
            [inv.id, inv.user_id, inv.client_id, inv.invoice_number, inv.status, inv.issue_date, inv.due_date, inv.subtotal, inv.tax_rate, inv.tax_amount, inv.discount_type, inv.discount_value, inv.discount_amount, inv.total_amount, inv.amount_paid, inv.balance_due, inv.currency, inv.notes, inv.terms, inv.created_at, inv.updated_at],
          );
        }
        for (const itm of this.memoryStore.invoice_items) {
          await this.pool.query(
            `INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, unit_price, tax_rate, total, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING`,
            [itm.id, itm.invoice_id, itm.product_id, itm.description, itm.quantity, itm.unit_price, itm.tax_rate, itm.total, itm.sort_order],
          );
        }
        for (const pay of this.memoryStore.payments) {
          await this.pool.query(
            `INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, transaction_reference, notes, receipt_url, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT DO NOTHING`,
            [pay.id, pay.user_id, pay.invoice_id, pay.amount, pay.payment_date, pay.payment_method, pay.transaction_reference, pay.notes, pay.receipt_url, pay.created_at],
          );
        }
        for (const exp of this.memoryStore.expenses) {
          await this.pool.query(
            `INSERT INTO expenses (id, user_id, client_id, category, vendor, amount, tax_amount, is_tax_deductible, expense_date, description, receipt_url, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT DO NOTHING`,
            [exp.id, exp.user_id, exp.client_id, exp.category, exp.vendor, exp.amount, exp.tax_amount, exp.is_tax_deductible, exp.expense_date, exp.description, exp.receipt_url, exp.created_at, exp.updated_at],
          );
        }
        this.logger.log('PostgreSQL seed completed.');
      }
    } catch (e: any) {
      this.logger.error(`Seeding error: ${e.message}`);
    }
  }
}
