import type { Transaction, RecurringBill, Budget, Investment } from '@/src/types';

const headers = { 'Content-Type': 'application/json' };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`API ${init?.method ?? 'GET'} ${url} → ${res.status}`);
  return res.json();
}

const get  = <T>(url: string)              => request<T>(url);
const post = <T>(url: string, body: unknown) => request<T>(url, { method: 'POST',   headers, body: JSON.stringify(body) });
const put  = <T>(url: string, body: unknown) => request<T>(url, { method: 'PUT',    headers, body: JSON.stringify(body) });
const del  = (url: string)                 => request<{ ok: boolean }>(url, { method: 'DELETE' });

// ─── Transactions ─────────────────────────────────────────────────────────────
export const getTransactions         = ()                                => get<Transaction[]>('/api/transactions');
export const createTransaction       = (t: Transaction)                  => post<Transaction>('/api/transactions', t);
export const createTransactionsBatch = (ts: Transaction[])               => post<Transaction[]>('/api/transactions/batch', ts);
export const updateTransaction       = (id: string, t: Partial<Transaction>) => put<Transaction>(`/api/transactions/${id}`, t);
export const deleteTransaction       = (id: string)                      => del(`/api/transactions/${id}`);
export const deletePendingByBill     = (billId: string)                  => del(`/api/transactions/by-bill/${billId}`);

// ─── Recurring Bills ──────────────────────────────────────────────────────────
export const getRecurringBills    = ()                                      => get<RecurringBill[]>('/api/recurring-bills');
export const createRecurringBill  = (b: RecurringBill)                      => post<RecurringBill>('/api/recurring-bills', b);
export const updateRecurringBill  = (id: string, b: Partial<RecurringBill>) => put<RecurringBill>(`/api/recurring-bills/${id}`, b);
export const deleteRecurringBill  = (id: string)                            => del(`/api/recurring-bills/${id}`);

// ─── Budgets ──────────────────────────────────────────────────────────────────
export const getBudgets    = ()                                   => get<Budget[]>('/api/budgets');
export const createBudget  = (b: Budget)                          => post<Budget>('/api/budgets', b);
export const updateBudget  = (id: string, b: Partial<Budget>)     => put<Budget>(`/api/budgets/${id}`, b);

// ─── Investments ──────────────────────────────────────────────────────────────
export const getInvestments    = ()                                      => get<Investment[]>('/api/investments');
export const createInvestment  = (i: Investment)                         => post<Investment>('/api/investments', i);
export const updateInvestment  = (id: string, i: Partial<Investment>)    => put<Investment>(`/api/investments/${id}`, i);
export const deleteInvestment  = (id: string)                            => del(`/api/investments/${id}`);

// ─── Reset ────────────────────────────────────────────────────────────────────
export const resetAll = () => post<{ ok: boolean }>('/api/reset', {});
