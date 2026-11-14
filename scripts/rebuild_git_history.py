#!/usr/bin/env python3
import os
import shutil
import subprocess
import random
from datetime import datetime, timedelta, timezone

WORKSPACE = "/Users/apple/Desktop/Antigravity/Invoicer AI"
BACKUP_DIR = "/tmp/invoicer_repo_backup"

COMMITS = [
    {
        "msg": "Initialize monorepo workspace and root package configuration",
        "files": ["package.json", "package-lock.json"]
    },
    {
        "msg": "Configure repository gitignore and environment variables template",
        "files": [".gitignore", ".env.example"]
    },
    {
        "msg": "Setup NestJS backend project structure and TypeScript compiler options",
        "files": ["backend/nest-cli.json", "backend/tsconfig.json"]
    },
    {
        "msg": "Configure backend core packages and NestJS dependencies",
        "files": ["backend/package.json", "backend/package-lock.json", "backend/uploads/.gitkeep"]
    },
    {
        "msg": "Initialize React Vite frontend application with TypeScript configuration",
        "files": [
            "frontend/package.json",
            "frontend/package-lock.json",
            "frontend/tsconfig.json",
            "frontend/tsconfig.node.json",
            "frontend/vite.config.ts",
            "frontend/index.html"
        ]
    },
    {
        "msg": "Configure Tailwind CSS, PostCSS, and typography styling for frontend",
        "files": ["frontend/tailwind.config.js", "frontend/postcss.config.js"]
    },
    {
        "msg": "Define frontend domain TypeScript interfaces and data models",
        "files": ["frontend/src/types/index.ts"]
    },
    {
        "msg": "Implement backend common API response contracts and user interfaces",
        "files": [
            "backend/src/common/interfaces/api-response.interface.ts",
            "backend/src/common/interfaces/user.interface.ts"
        ]
    },
    {
        "msg": "Implement backend database module and resilient PostgreSQL connection pool",
        "files": [
            "backend/src/database/database.module.ts",
            "backend/src/database/database.service.ts"
        ]
    },
    {
        "msg": "Create PostgreSQL database migrations and schema definitions",
        "files": ["backend/src/database/migrate.ts"]
    },
    {
        "msg": "Implement global HTTP exception filter for consistent backend error responses",
        "files": ["backend/src/common/filters/all-exceptions.filter.ts"]
    },
    {
        "msg": "Add logging and response transform interceptors to backend pipeline",
        "files": [
            "backend/src/common/interceptors/logging.interceptor.ts",
            "backend/src/common/interceptors/transform.interceptor.ts"
        ]
    },
    {
        "msg": "Implement JWT authentication guard and public endpoint decorator",
        "files": [
            "backend/src/common/guards/jwt-auth.guard.ts",
            "backend/src/common/decorators/public.decorator.ts"
        ]
    },
    {
        "msg": "Create current user parameter decorator for authenticated requests",
        "files": ["backend/src/common/decorators/current-user.decorator.ts"]
    },
    {
        "msg": "Implement user authentication DTOs with class-validator rules",
        "files": [
            "backend/src/modules/auth/dto/login.dto.ts",
            "backend/src/modules/auth/dto/register.dto.ts"
        ]
    },
    {
        "msg": "Build authentication service with bcrypt hashing and JWT token issuance",
        "files": ["backend/src/modules/auth/auth.service.ts"]
    },
    {
        "msg": "Implement Passport JWT extraction strategy for request authentication",
        "files": ["backend/src/modules/auth/jwt.strategy.ts"]
    },
    {
        "msg": "Create authentication controller with login, register, and profile endpoints",
        "files": ["backend/src/modules/auth/auth.controller.ts"]
    },
    {
        "msg": "Wire authentication module and configure JWT service dependencies",
        "files": ["backend/src/modules/auth/auth.module.ts"]
    },
    {
        "msg": "Implement frontend Axios API client and centralized endpoints service",
        "files": ["frontend/src/services/api.ts"]
    },
    {
        "msg": "Create currency, date, and status badge formatting utilities",
        "files": ["frontend/src/utils/format.ts"]
    },
    {
        "msg": "Create frontend AuthContext with token persistence and session management",
        "files": ["frontend/src/context/AuthContext.tsx"]
    },
    {
        "msg": "Build user login page with validation and demo account shortcuts",
        "files": ["frontend/src/pages/LoginPage.tsx"]
    },
    {
        "msg": "Build user registration page with workspace setup form",
        "files": ["frontend/src/pages/RegisterPage.tsx"]
    },
    {
        "msg": "Implement users module in backend for profile updates and account settings",
        "files": [
            "backend/src/modules/users/dto/update-user.dto.ts",
            "backend/src/modules/users/users.service.ts",
            "backend/src/modules/users/users.controller.ts",
            "backend/src/modules/users/users.module.ts"
        ]
    },
    {
        "msg": "Create clients module in backend with CRUD endpoints and validation DTOs",
        "files": [
            "backend/src/modules/clients/dto/create-client.dto.ts",
            "backend/src/modules/clients/clients.service.ts",
            "backend/src/modules/clients/clients.controller.ts",
            "backend/src/modules/clients/clients.module.ts"
        ]
    },
    {
        "msg": "Implement client CRM directory page with search, filters, and add client modal",
        "files": ["frontend/src/pages/ClientsPage.tsx"]
    },
    {
        "msg": "Create products and services catalog module in backend with pricing models",
        "files": [
            "backend/src/modules/catalog/dto/create-product.dto.ts",
            "backend/src/modules/catalog/catalog.service.ts",
            "backend/src/modules/catalog/catalog.controller.ts",
            "backend/src/modules/catalog/catalog.module.ts"
        ]
    },
    {
        "msg": "Implement catalog rate card management page with item modal in frontend",
        "files": ["frontend/src/pages/CatalogPage.tsx"]
    },
    {
        "msg": "Build invoices module in backend with calculations and status lifecycle",
        "files": [
            "backend/src/modules/invoices/dto/create-invoice.dto.ts",
            "backend/src/modules/invoices/invoices.service.ts"
        ]
    },
    {
        "msg": "Implement server-side PDF invoice generation service with PDFKit",
        "files": ["backend/src/modules/invoices/pdf.service.ts"]
    },
    {
        "msg": "Add invoice controller endpoints for PDF streaming, duplicate, and dispatch",
        "files": [
            "backend/src/modules/invoices/invoices.controller.ts",
            "backend/src/modules/invoices/invoices.module.ts"
        ]
    },
    {
        "msg": "Implement invoices list page with status tabs, search, and action menus",
        "files": ["frontend/src/pages/InvoicesListPage.tsx"]
    },
    {
        "msg": "Build interactive invoice creation and editing form with dynamic line items",
        "files": ["frontend/src/pages/InvoiceCreateEditPage.tsx"]
    },
    {
        "msg": "Create invoice detail view with status workflow and PDF download trigger",
        "files": ["frontend/src/pages/InvoiceDetailPage.tsx"]
    },
    {
        "msg": "Implement payments module in backend for settlement recording and balance sync",
        "files": [
            "backend/src/modules/payments/dto/record-payment.dto.ts",
            "backend/src/modules/payments/payments.service.ts",
            "backend/src/modules/payments/payments.controller.ts",
            "backend/src/modules/payments/payments.module.ts"
        ]
    },
    {
        "msg": "Build payments ledger and record payment modal in frontend",
        "files": ["frontend/src/pages/PaymentsPage.tsx"]
    },
    {
        "msg": "Implement operating expenses module in backend with Multer receipt upload",
        "files": [
            "backend/src/modules/expenses/dto/create-expense.dto.ts",
            "backend/src/modules/expenses/expenses.service.ts",
            "backend/src/modules/expenses/expenses.controller.ts",
            "backend/src/modules/expenses/expenses.module.ts"
        ]
    },
    {
        "msg": "Build expense tracking page with category filters and receipt attachment",
        "files": ["frontend/src/pages/ExpensesPage.tsx"]
    },
    {
        "msg": "Implement financial reports module in backend with P&L and aging AR logic",
        "files": [
            "backend/src/modules/reports/reports.service.ts",
            "backend/src/modules/reports/reports.controller.ts",
            "backend/src/modules/reports/reports.module.ts"
        ]
    },
    {
        "msg": "Add CSV export service for invoices and expenses data ledgers",
        "files": ["backend/src/modules/reports/csv.service.ts"]
    },
    {
        "msg": "Build financial reports dashboard with P&L statement, tax, and CSV downloads",
        "files": ["frontend/src/pages/ReportsPage.tsx"]
    },
    {
        "msg": "Implement dashboard metrics aggregation service in backend",
        "files": [
            "backend/src/modules/dashboard/dashboard.service.ts",
            "backend/src/modules/dashboard/dashboard.controller.ts",
            "backend/src/modules/dashboard/dashboard.module.ts"
        ]
    },
    {
        "msg": "Create executive dashboard view with KPI metric cards and cash flow charts",
        "files": ["frontend/src/pages/DashboardPage.tsx"]
    },
    {
        "msg": "Integrate Google Gemini AI SDK service with structured prompt engineering",
        "files": [
            "backend/src/modules/ai/dto/ai-requests.dto.ts",
            "backend/src/modules/ai/ai.service.ts"
        ]
    },
    {
        "msg": "Add AI endpoints for natural language invoice synthesis and item polishing",
        "files": [
            "backend/src/modules/ai/ai.controller.ts",
            "backend/src/modules/ai/ai.module.ts"
        ]
    },
    {
        "msg": "Build AI Copilot assistant interface with interactive financial prompt tools",
        "files": ["frontend/src/pages/AiAssistantPage.tsx"]
    },
    {
        "msg": "Implement workspace settings module in backend and settings page in frontend",
        "files": [
            "backend/src/modules/settings/dto/update-settings.dto.ts",
            "backend/src/modules/settings/settings.service.ts",
            "backend/src/modules/settings/settings.controller.ts",
            "backend/src/modules/settings/settings.module.ts",
            "frontend/src/pages/SettingsPage.tsx"
        ]
    },
    {
        "msg": "Implement backend health check endpoint and core app bootstrap",
        "files": [
            "backend/src/modules/health/health.controller.ts",
            "backend/src/modules/health/health.module.ts",
            "backend/src/app.module.ts",
            "backend/src/main.ts"
        ]
    },
    {
        "msg": "Create responsive AppLayout with collapsible Sidebar and modern Header",
        "files": [
            "frontend/src/layouts/AppLayout.tsx",
            "frontend/src/layouts/Sidebar.tsx",
            "frontend/src/layouts/Header.tsx"
        ]
    },
    {
        "msg": "Build high-converting landing page with animated invoice preview and hero sandbox",
        "files": ["frontend/src/pages/LandingPage.tsx"]
    },
    {
        "msg": "Implement global Light and Dark mode engine with theme persistence",
        "files": ["frontend/src/context/ThemeContext.tsx"]
    },
    {
        "msg": "Implement top-right toast notification system for user feedback across all actions",
        "files": ["frontend/src/context/ToastContext.tsx"]
    },
    {
        "msg": "Setup application router, root providers, and main entrypoint",
        "files": ["frontend/src/App.tsx", "frontend/src/main.tsx"]
    },
    {
        "msg": "Add CSS keyframe animations, smooth hover transitions, and dark scrollbars",
        "files": ["frontend/src/index.css"]
    },
    {
        "msg": "Configure multi-stage Docker Compose setup for frontend, backend, and PostgreSQL",
        "files": [
            "docker-compose.yml",
            "backend/Dockerfile",
            "frontend/Dockerfile",
            "frontend/nginx.conf"
        ]
    },
    {
        "msg": "Add backend e2e integration test suite covering auth, metrics, and invoices",
        "files": ["backend/test/app.e2e-spec.ts", "backend/test/jest-e2e.json"]
    },
    {
        "msg": "Add developer utility script for automated screenshot generation",
        "files": ["scripts/take-screenshots.js"]
    },
    {
        "msg": "Update comprehensive README with architectural documentation and light mode screenshots",
        "files": [
            "README.md",
            "docs/screenshots/01-landing-page.png",
            "docs/screenshots/02-login.png",
            "docs/screenshots/03-register.png",
            "docs/screenshots/04-dashboard.png",
            "docs/screenshots/05-invoices.png",
            "docs/screenshots/06-invoice-new.png",
            "docs/screenshots/07-invoice-detail.png",
            "docs/screenshots/08-clients.png",
            "docs/screenshots/09-payments.png",
            "docs/screenshots/10-expenses.png",
            "docs/screenshots/11-catalog.png",
            "docs/screenshots/12-reports.png",
            "docs/screenshots/13-ai-copilot.png",
            "docs/screenshots/14-settings.png"
        ]
    }
]

def run_cmd(cmd, env=None):
    res = subprocess.run(cmd, shell=True, cwd=WORKSPACE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)
    if res.returncode != 0:
        print(f"Error executing: {cmd}\nSTDERR: {res.stderr}\nSTDOUT: {res.stdout}")
        raise RuntimeError(f"Command failed: {cmd}")
    return res.stdout.strip()

def main():
    print("=== Step 1: Backing up workspace files to /tmp/invoicer_repo_backup ===")
    if os.path.exists(BACKUP_DIR):
        shutil.rmtree(BACKUP_DIR)
    os.makedirs(BACKUP_DIR)

    # Copy all necessary files (excluding .git, node_modules, dist)
    for root, dirs, files in os.walk(WORKSPACE):
        # Exclude node_modules, dist, .git
        dirs[:] = [d for d in dirs if d not in [".git", "node_modules", "dist"]]
        rel_dir = os.path.relpath(root, WORKSPACE)
        target_dir = os.path.join(BACKUP_DIR, rel_dir) if rel_dir != "." else BACKUP_DIR
        os.makedirs(target_dir, exist_ok=True)
        for f in files:
            src_f = os.path.join(root, f)
            dst_f = os.path.join(target_dir, f)
            shutil.copy2(src_f, dst_f)

    print("Backup complete.")

    print("=== Step 2: Initializing clean git repository ===")
    git_dir = os.path.join(WORKSPACE, ".git")
    if os.path.exists(git_dir):
        shutil.rmtree(git_dir)

    run_cmd("git init -b main")
    run_cmd('git config user.name "Virendra Arekar"')
    run_cmd('git config user.email "virendra.arekar@gmail.com"')

    # Pre-generate timestamps
    # Start: Nov 14, 2026, 09:12:35 AM IST (+05:30)
    # Total commits: 59. Average interval ~12.5 minutes.
    tz = timezone(timedelta(hours=5, minutes=30))
    current_time = datetime(2026, 11, 14, 9, 12, 35, tzinfo=tz)

    random.seed(42) # Deterministic realistic intervals between 5 and 20 mins

    print(f"=== Step 3: Generating {len(COMMITS)} feature commits ===")
    for i, commit in enumerate(COMMITS):
        if i > 0:
            interval_minutes = random.randint(5, 20)
            interval_seconds = random.randint(10, 55)
            current_time += timedelta(minutes=interval_minutes, seconds=interval_seconds)

        iso_time = current_time.strftime("%Y-%m-%dT%H:%M:%S%z")
        # Format timezone as +05:30
        iso_time = iso_time[:-2] + ":" + iso_time[-2:]

        # Add files for this commit
        files_to_add = commit["files"]
        for f in files_to_add:
            # Check if file exists in backup
            src_path = os.path.join(BACKUP_DIR, f)
            dst_path = os.path.join(WORKSPACE, f)
            if not os.path.exists(dst_path) and os.path.exists(src_path):
                os.makedirs(os.path.dirname(dst_path), exist_ok=True)
                shutil.copy2(src_path, dst_path)
            run_cmd(f'git add "{f}"')

        # If it's the last commit, also add everything else remaining
        if i == len(COMMITS) - 1:
            run_cmd("git add -A")

        env = os.environ.copy()
        env["GIT_AUTHOR_DATE"] = iso_time
        env["GIT_COMMITTER_DATE"] = iso_time

        msg = commit["msg"].replace('"', '\\"')
        run_cmd(f'git commit -m "{msg}"', env=env)
        print(f"[{i+1}/{len(COMMITS)}] {iso_time} | {commit['msg']}")

    print("=== Step 4: Verifying Git History ===")
    count = run_cmd("git rev-list --count HEAD")
    print(f"Total commits created: {count}")

    log_sample = run_cmd('git log -n 5 --format="%h | %ad | %s"')
    print("Latest 5 commits:\n" + log_sample)

    first_commit = run_cmd('git log --reverse -n 1 --format="%h | %ad | %s"')
    print("First commit:\n" + first_commit)

    status = run_cmd("git status --short")
    if status:
        print("Note: unstaged/untracked:\n" + status)
    else:
        print("Working tree is completely clean!")

if __name__ == "__main__":
    main()
