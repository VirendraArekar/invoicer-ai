import axios from 'axios';
import {
  Client,
  DashboardSummary,
  Expense,
  Invoice,
  Payment,
  Product,
  Settings,
  User,
} from '../types';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('invoicer_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // If backend returns TransformInterceptor shape { success: true, data: ... }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('invoicer_token');
      localStorage.removeItem('invoicer_user');
      window.location.href = '/login';
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  },
);

// Auth Service
export const authApi = {
  login: (data: any) => apiClient.post<{ user: User; accessToken: string }>('/auth/login', data) as any,
  register: (data: any) => apiClient.post<{ user: User; accessToken: string }>('/auth/register', data) as any,
  demoLogin: () => apiClient.post<{ user: User; accessToken: string }>('/auth/demo-login') as any,
  me: () => apiClient.get<User>('/auth/me') as any,
};

// Dashboard Service
export const dashboardApi = {
  getSummary: () => apiClient.get<DashboardSummary>('/dashboard/summary') as any,
};

// Invoices Service
export const invoicesApi = {
  getAll: (params?: { status?: string; clientId?: string; search?: string }) =>
    apiClient.get<Invoice[]>('/invoices', { params }) as any,
  getOne: (id: string) => apiClient.get<Invoice>(`/invoices/${id}`) as any,
  create: (data: any) => apiClient.post<Invoice>('/invoices', data) as any,
  update: (id: string, data: any) => apiClient.patch<Invoice>(`/invoices/${id}`, data) as any,
  updateStatus: (id: string, status: string) => apiClient.patch<Invoice>(`/invoices/${id}/status`, { status }) as any,
  duplicate: (id: string) => apiClient.post<Invoice>(`/invoices/${id}/duplicate`) as any,
  sendEmail: (id: string) => apiClient.post<{ success: boolean; message: string }>(`/invoices/${id}/send`) as any,
  delete: (id: string) => apiClient.delete(`/invoices/${id}`) as any,
  downloadPdfUrl: (id: string) => `/api/invoices/${id}/pdf`,
};

// Clients Service
export const clientsApi = {
  getAll: (params?: { search?: string }) => apiClient.get<Client[]>('/clients', { params }) as any,
  getOne: (id: string) => apiClient.get<Client>(`/clients/${id}`) as any,
  create: (data: any) => apiClient.post<Client>('/clients', data) as any,
  update: (id: string, data: any) => apiClient.patch<Client>(`/clients/${id}`, data) as any,
  delete: (id: string) => apiClient.delete(`/clients/${id}`) as any,
};

// Payments Service
export const paymentsApi = {
  getAll: () => apiClient.get<Payment[]>('/payments') as any,
  getOne: (id: string) => apiClient.get<Payment>(`/payments/${id}`) as any,
  record: (data: any) => apiClient.post<Payment>('/payments', data) as any,
  delete: (id: string) => apiClient.delete(`/payments/${id}`) as any,
};

// Expenses Service
export const expensesApi = {
  getAll: (params?: { category?: string; search?: string }) =>
    apiClient.get<Expense[]>('/expenses', { params }) as any,
  getOne: (id: string) => apiClient.get<Expense>(`/expenses/${id}`) as any,
  create: (data: any) => apiClient.post<Expense>('/expenses', data) as any,
  update: (id: string, data: any) => apiClient.patch<Expense>(`/expenses/${id}`, data) as any,
  delete: (id: string) => apiClient.delete(`/expenses/${id}`) as any,
  uploadReceipt: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/expenses/upload-receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as any;
  },
};

// Catalog Service
export const catalogApi = {
  getAll: (params?: { search?: string }) => apiClient.get<Product[]>('/catalog', { params }) as any,
  getOne: (id: string) => apiClient.get<Product>(`/catalog/${id}`) as any,
  create: (data: any) => apiClient.post<Product>('/catalog', data) as any,
  update: (id: string, data: any) => apiClient.patch<Product>(`/catalog/${id}`, data) as any,
  delete: (id: string) => apiClient.delete(`/catalog/${id}`) as any,
};

// Reports Service
export const reportsApi = {
  getProfitLoss: () => apiClient.get('/reports/profit-loss') as any,
  getTaxSummary: () => apiClient.get('/reports/tax-summary') as any,
  getAgingAr: () => apiClient.get('/reports/aging-ar') as any,
  invoicesCsvUrl: '/api/reports/export/invoices-csv',
  expensesCsvUrl: '/api/reports/export/expenses-csv',
};

// Settings Service
export const settingsApi = {
  get: () => apiClient.get<Settings>('/settings') as any,
  update: (data: any) => apiClient.patch<Settings>('/settings', data) as any,
};

// AI Service
export const aiApi = {
  generateInvoice: (prompt: string) => apiClient.post('/ai/generate-invoice', { prompt }) as any,
  polishItem: (rawDescription: string) => apiClient.post('/ai/polish-item', { rawDescription }) as any,
  draftReminder: (data: {
    invoiceNumber: string;
    clientName: string;
    amountDue: number;
    daysOverdue: number;
    tone?: 'polite' | 'firm' | 'urgent';
  }) => apiClient.post('/ai/draft-reminder', data) as any,
  getFinancialInsights: () => apiClient.get('/ai/financial-insights') as any,
  parseReceipt: (receiptText: string) => apiClient.post('/ai/parse-receipt', { receiptText }) as any,
};
