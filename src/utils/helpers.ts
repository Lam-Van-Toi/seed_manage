
export const formatDate = (dateString?: string | Date): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

export const formatCurrency = (amount?: number, currency = 'VND'): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'N/A';
  return amount.toLocaleString('vi-VN', { style: 'currency', currency: currency });
};

export const generateId = (): string => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
};

export const classNames = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Simple debounce function
export function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>): Promise<ReturnType<F>> => {
    return new Promise<ReturnType<F>>((resolve) => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
  };

  return debounced;
}
