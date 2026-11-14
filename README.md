# Invoicer AI – Full-Stack AI-Powered Invoicing & Billing SaaS

[![NestJS](https://img.shields.io/badge/Backend-NestJS%2010-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Neon-336791?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%204-4285F4?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)

**Invoicer AI** is a production-grade, full-stack invoicing and billing SaaS platform designed for modern software agencies, consultancies, SaaS businesses, and freelancers. It combines traditional double-entry billing principles with cutting-edge **Google Gemini AI** to automate natural language invoice creation, polite-to-urgent debt collection follow-ups, receipt OCR data extraction, and executive cash flow forecasting.

---

## 📸 Application Screenshots (Light Theme)

| 🏠 Landing Page & AI Demo | 📊 Unified Financial Dashboard |
| :---: | :---: |
| ![Landing Page](docs/screenshots/01-landing-page.png) | ![Dashboard](docs/screenshots/04-dashboard.png) |

| 📄 Invoices Directory & Status Ledger | ✏️ Live Invoice Editor & Tax Preview |
| :---: | :---: |
| ![Invoices List](docs/screenshots/05-invoices.png) | ![Invoice Editor](docs/screenshots/06-invoice-new.png) |

| 🔍 High-Resolution Invoice Detail & PDF | 👥 Client Management & AR Balances |
| :---: | :---: |
| ![Invoice Detail](docs/screenshots/07-invoice-detail.png) | ![Clients](docs/screenshots/08-clients.png) |

| 💳 Settlements & Payment Reconciliation | 🧾 Categorized Operating Expenses & OCR |
| :---: | :---: |
| ![Payments](docs/screenshots/09-payments.png) | ![Expenses](docs/screenshots/10-expenses.png) |

| 📦 Products & Services Rate Card Catalog | 📈 P&L, Tax Summary & Aging AR Reports |
| :---: | :---: |
| ![Catalog](docs/screenshots/11-catalog.png) | ![Reports](docs/screenshots/12-reports.png) |

| 🤖 Google Gemini AI Command Center | ⚙️ Workspace Settings & Preferences |
| :---: | :---: |
| ![AI Copilot](docs/screenshots/13-ai-copilot.png) | ![Settings](docs/screenshots/14-settings.png) |

| 🔐 Authentication & 1-Click Demo Login | 📝 Workspace Organization Registration |
| :---: | :---: |
| ![Login Page](docs/screenshots/02-login.png) | ![Register Page](docs/screenshots/03-register.png) |

---

## 🌟 Key Features

### 1. 🤖 Google Gemini AI Copilot Suite
- **Natural Language Invoice Synthesis**: Turn conversational prompts into itemized, categorized invoices with automated tax rates, subtotals, and payment terms (e.g. *"Invoice Acme for 20 hours backend work at $160/hr and $300 server setup fee"*).
- **Deliverable Description Polishing**: Click "Polish with AI" on any raw line item to expand it into clear, professional deliverables and scope statements.
- **Tone-Adaptive Debt Collection**: Generate customized payment reminders in **Polite**, **Firm**, or **Urgent** tones depending on days overdue, compressing the Days Sales Outstanding (DSO) cycle.
- **Receipt OCR Data Extractor**: Paste raw invoice slips or text receipts; Gemini extracts vendor, amount, tax, and determines tax-deductibility flags.
- **Executive Financial Advisor**: Analyzes accounts receivable aging, operating margins, and burn rate to compute an overall financial health score (0–100) and actionable growth moves.

### 2. 📄 Invoices & High-Resolution PDF Engine
- Full CRUD for invoices with line items, tax brackets, percentage/fixed discounts, custom currency, payment terms, and notes.
- Status management: `Draft`, `Sent`, `Partial`, `Paid`, `Overdue`, `Cancelled`.
- **Server-side PDF Generation**: Built with PDFKit, generating crisp A4 tax invoices with custom company branding, customer details, itemized tables, and bank remittance instructions.
- Real-time **Live Document Preview** while editing.
- Simulated instant email invoice dispatch.

### 3. 👥 Client Relationship Directory
- Track clients, billing addresses, tax/VAT IDs, contact details, total billed history, and active balance due.
- Inline modal creation directly accessible while drafting invoices.

### 4. 💳 Payment Reconciliation Ledger
- Record incoming wire, ACH, card, check, or PayPal payments against invoices.
- Automated status progression (`Partial` -> `Paid`) and automatic balance restoration upon transaction reversal.

### 5. 🧾 Operating Expenses & Multer File Uploads
- Categorize expenditures (Software & Cloud, Workspace, Hardware, Contractor Labor, Travel, Marketing).
- Tax-deductible flag for automated tax audits.
- Multer-powered receipt image and document storage.

### 6. 📦 Product & Services Catalog
- Maintain standard rate cards, SKU numbers, units (hour, project, sprint, month), and default tax rates for 1-click invoice item insertion.

### 7. 📊 Reports & CSV Data Exports
- **Profit & Loss Statement**: Waterfall overview of income, categorized expenses, and net profit margins.
- **Tax & Deduction Ledger**: Tax collected vs deductible expense tax credits.
- **Accounts Receivable Aging Analysis**: Invoices bucketed into `Current`, `1–30 Days`, `31–60 Days`, `61–90 Days`, and `90+ Days`.
- **1-Click CSV Exports**: Download standard spreadsheet files for invoices, expenses, and accounts receivable.

---

## 🏗️ Architecture & Monorepo Structure

```text
invoicer-ai/
├── frontend/                     # React + Vite + TypeScript + Tailwind CSS
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/           # Reusable UI component architecture
│   │   ├── layouts/              # AppLayout, Sidebar, Header
│   │   ├── pages/                # Landing, Login, Register, Dashboard, Invoices, Clients, etc.
│   │   ├── hooks/
│   │   ├── services/             # Axios API client services (invoices, auth, ai, etc.)
│   │   ├── context/              # AuthContext with 1-click demo login
│   │   ├── routes/
│   │   ├── utils/                # formatCurrency, formatDate, badge helpers
│   │   ├── types/                # TypeScript interfaces and domain types
│   │   ├── App.tsx               # TanStack Query & React Router v7
│   │   ├── main.tsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                      # NestJS 10 + Node.js + TypeScript
│   ├── src/
│   │   ├── common/
│   │   │   ├── decorators/       # @CurrentUser(), @Public()
│   │   │   ├── filters/          # AllExceptionsFilter
│   │   │   ├── guards/           # JwtAuthGuard
│   │   │   ├── interceptors/     # TransformInterceptor, LoggingInterceptor
│   │   │   ├── pipes/            # ValidationPipe
│   │   │   └── interfaces/       # ApiResponse, User
│   │   ├── config/
│   │   ├── database/             # PostgreSQL pg.Pool + Schema migrations + Fallback store
│   │   ├── modules/
│   │   │   ├── auth/             # JWT Auth, bcrypt password hashing, Demo login
│   │   │   ├── users/            # User profile management
│   │   │   ├── dashboard/        # Unified metrics, trends, and AI pulse
│   │   │   ├── clients/          # Client directory CRUD & analytics
│   │   │   ├── invoices/         # Invoices CRUD, calculations, PDFKit service
│   │   │   ├── payments/         # Payment records & invoice reconciliation
│   │   │   ├── expenses/         # Expense tracking & Multer file uploads
│   │   │   ├── catalog/          # Products & services rate cards
│   │   │   ├── reports/          # P&L, Tax summary, AR aging, CSV generation
│   │   │   ├── settings/         # Company branding & invoice templates
│   │   │   └── ai/               # Google Gemini (@google/genai) integration
│   │   ├── app.module.ts
│   │   └── main.ts               # Swagger OpenAPI setup, CORS, prefix
│   ├── test/                     # Supertest e2e integration tests & Jest config
│   ├── uploads/                  # Multer static receipt storage
│   └── package.json
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or later (v24+ recommended)
- **npm**: v9.0.0 or later

### 1. Clone & Install Dependencies

From the repository root:
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

Environment options:
```env
PORT=4000
NODE_ENV=development
JWT_SECRET=super-secret-jwt-key-for-invoicer-ai-development-mode-2026
JWT_EXPIRATION=7d

# Database Configuration:
# Option 1: Local Docker PostgreSQL
DATABASE_URL=postgresql://invoicer_user:invoicer_secret_password@localhost:5432/invoicer_db
DATABASE_SSL=false

# Option 2: Neon Cloud PostgreSQL
# DATABASE_URL=postgresql://[user]:[password]@[ep-branch-id].us-east-2.aws.neon.tech/neondb?sslmode=require
# DATABASE_SSL=true

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-4-hydrogen
```

> **Note on Resilient Zero-Config Mode:** If PostgreSQL is temporarily offline, Invoicer AI's resilient `DatabaseService` activates an embedded persistent SQL-compatible store pre-seeded with rich demo data, ensuring complete continuity without crashes!

---

## 🏃 Running the Application

### Option A: Docker Compose (All-In-One, Recommended)
Run the entire production stack with a single command:
```bash
docker compose up --build
```
This orchestrates:
- **`invoicer-ai-postgres`** (PostgreSQL 16 Alpine on port `5432`)
- **`invoicer-ai-backend`** (NestJS REST API on port `4000`)
- **`invoicer-ai-frontend`** (Nginx SPA proxy on port `5173`)

### Option B: Local Development Mode

**Start Backend API Server (Port 4000):**
```bash
cd backend
npm run start:dev
```
- API Base URL: `http://localhost:4000/api`
- Swagger OpenAPI Docs: `http://localhost:4000/api/docs`

**Start Frontend Development Server (Port 5173):**
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173/`

### 1-Click Instant Demo Login
When opening the web application at `http://localhost:5173/`, you can:
- Click the **"1-Click Demo"** button on the landing page or login screen.
- Pre-configured demo credentials:
  - **Email:** `demo@invoicerai.com`
  - **Password:** `password123`

---

## 🧪 Testing

### Backend Integration & E2E Tests
To run the automated Supertest and Jest integration suites:
```bash
cd backend
npm run test:e2e
```

Tests cover:
- Authentication and JWT token generation
- Dashboard financial metrics calculation
- Invoice list and detail querying
- AI line item description polishing

---

## 📚 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new business workspace |
| `POST` | `/api/auth/login` | Authenticate with credentials |
| `POST` | `/api/auth/demo-login` | Instant demo account authentication |
| `GET` | `/api/dashboard/summary` | Real-time KPI metrics, cash flow trends, and AI health score |
| `GET` | `/api/invoices` | List and filter invoices by status, client, or keyword |
| `POST` | `/api/invoices` | Create new invoice with line items, tax, and discount |
| `GET` | `/api/invoices/:id/pdf` | Stream high-resolution PDF tax invoice |
| `POST` | `/api/invoices/:id/send` | Simulate invoice delivery via email |
| `POST` | `/api/invoices/:id/duplicate` | Clone existing invoice to a new draft |
| `POST` | `/api/payments` | Record payment against invoice and update balance |
| `POST` | `/api/expenses/upload-receipt` | Multer multipart file upload for receipts |
| `GET` | `/api/reports/profit-loss` | P&L financial statement |
| `GET` | `/api/reports/aging-ar` | Accounts Receivable aging analysis (0–30, 31–60, 61–90, 90+ days) |
| `GET` | `/api/reports/export/invoices-csv` | Download complete invoices ledger CSV |
| `GET` | `/api/reports/export/expenses-csv` | Download complete expenses ledger CSV |
| `POST` | `/api/ai/generate-invoice` | Gemini AI natural language invoice synthesis |
| `POST` | `/api/ai/polish-item` | Gemini AI invoice item scope enhancer |
| `POST` | `/api/ai/draft-reminder` | Gemini AI polite, firm, or urgent payment reminder drafter |
| `GET` | `/api/ai/financial-insights` | Gemini AI executive financial analysis & runway forecast |
| `POST` | `/api/ai/parse-receipt` | Gemini AI receipt OCR data extractor |

Explore all interactive endpoints in the live Swagger UI: `http://localhost:4000/api/docs`.

---

## 📄 License
MIT License. Built by the Invoicer AI Team.
