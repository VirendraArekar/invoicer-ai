export const formatCurrency = (amount: number | string = 0, currency: string = 'USD'): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
};

export const formatDate = (dateStr?: string | Date): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(dateStr).substring(0, 10);
  }
};

export const getStatusBadge = (status: string = 'draft') => {
  switch (status.toLowerCase()) {
    case 'paid':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
        dot: 'bg-emerald-500',
        label: 'Paid',
      };
    case 'sent':
      return {
        bg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
        dot: 'bg-blue-500',
        label: 'Sent',
      };
    case 'partial':
      return {
        bg: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20',
        dot: 'bg-cyan-500',
        label: 'Partial',
      };
    case 'overdue':
      return {
        bg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
        dot: 'bg-rose-500',
        label: 'Overdue',
      };
    case 'cancelled':
      return {
        bg: 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/20',
        dot: 'bg-slate-400',
        label: 'Cancelled',
      };
    default:
      return {
        bg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
        dot: 'bg-amber-500',
        label: 'Draft',
      };
  }
};
