import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

// Parses a monetary string (comma or dot decimal), rounds to 2 decimal places.
// Returns null if the value is not a valid finite positive number.
export function parseAmount(value: string): number | null {
  const n = parseFloat(String(value).replace(',', '.'));
  if (!isFinite(n) || isNaN(n)) return null;
  return Math.round(n * 100) / 100;
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}
