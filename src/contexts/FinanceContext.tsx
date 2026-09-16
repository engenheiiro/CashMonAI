import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Transaction,
  RecurringBill,
  Budget,
  Category,
  DEFAULT_CATEGORIES,
  Investment,
} from '../types';
import { startOfMonth, isSameMonth, parseISO, addMonths, endOfMonth, isAfter } from 'date-fns';
import * as api from '../lib/api';

interface FinanceState {
  transactions: Transaction[];
  recurringBills: RecurringBill[];
  budgets: Budget[];
  categories: Category[];
  investments: Investment[];
}

interface FinanceContextType extends FinanceState {
  loading: boolean;

  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addRecurringBill: (b: Omit<RecurringBill, 'id'>) => void;
  updateRecurringBill: (id: string, b: Partial<RecurringBill>) => void;
  deleteRecurringBill: (id: string) => void;

  addBudget: (b: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, b: Partial<Budget>) => void;

  addInvestment: (i: Omit<Investment, 'id'>) => void;
  updateInvestment: (id: string, i: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;

  processRecurringBills: () => Promise<void>;
  resetWallet: () => Promise<void>;
}

const EMPTY_STATE: FinanceState = {
  transactions: [],
  recurringBills: [],
  budgets: [],
  categories: DEFAULT_CATEGORIES,
  investments: [],
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FinanceState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Always-current state ref for use inside async functions
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // ─── Load from MongoDB on mount ──────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [transactions, recurringBills, budgets, investments] = await Promise.all([
          api.getTransactions(),
          api.getRecurringBills(),
          api.getBudgets(),
          api.getInvestments(),
        ]);
        setState({ transactions, recurringBills, budgets, investments, categories: DEFAULT_CATEGORIES });
      } catch (err) {
        console.error('Failed to load data from API:', err);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    }
    load();
  }, []);

  // Run after first load to fill missing recurring-bill projections
  useEffect(() => {
    if (initialized) processRecurringBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  // ─── Transactions ─────────────────────────────────────────────────────────────
  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...t, id: uuidv4() };
    setState(s => ({ ...s, transactions: [...s.transactions, newTx] }));
    api.createTransaction(newTx).catch(console.error);
  };

  const updateTransaction = (id: string, t: Partial<Transaction>) => {
    setState(s => ({ ...s, transactions: s.transactions.map(tx => tx.id === id ? { ...tx, ...t } : tx) }));
    api.updateTransaction(id, t).catch(console.error);
  };

  const deleteTransaction = (id: string) => {
    setState(s => ({ ...s, transactions: s.transactions.filter(tx => tx.id !== id) }));
    api.deleteTransaction(id).catch(console.error);
  };

  // ─── Recurring Bills ──────────────────────────────────────────────────────────
  const addRecurringBill = (b: Omit<RecurringBill, 'id'>) => {
    const newBill: RecurringBill = { ...b, id: uuidv4() };
    setState(s => ({ ...s, recurringBills: [...s.recurringBills, newBill] }));
    api.createRecurringBill(newBill).catch(console.error);
  };

  const updateRecurringBill = (id: string, b: Partial<RecurringBill>) => {
    setState(s => ({
      ...s,
      transactions: s.transactions.filter(tx => !(tx.recurringBillId === id && tx.status === 'pending')),
      recurringBills: s.recurringBills.map(rb => rb.id === id ? { ...rb, ...b } : rb),
    }));
    // Delete pending projections then update the bill in DB
    api.deletePendingByBill(id).catch(console.error);
    api.updateRecurringBill(id, b).catch(console.error);
  };

  const deleteRecurringBill = (id: string) => {
    setState(s => ({
      ...s,
      transactions: s.transactions.filter(tx => !(tx.recurringBillId === id && tx.status === 'pending')),
      recurringBills: s.recurringBills.filter(rb => rb.id !== id),
    }));
    api.deletePendingByBill(id).catch(console.error);
    api.deleteRecurringBill(id).catch(console.error);
  };

  // ─── Budgets ──────────────────────────────────────────────────────────────────
  const addBudget = (b: Omit<Budget, 'id'>) => {
    const newBudget: Budget = { ...b, id: uuidv4() };
    setState(s => ({ ...s, budgets: [...s.budgets, newBudget] }));
    api.createBudget(newBudget).catch(console.error);
  };

  const updateBudget = (id: string, b: Partial<Budget>) => {
    setState(s => ({ ...s, budgets: s.budgets.map(bg => bg.id === id ? { ...bg, ...b } : bg) }));
    api.updateBudget(id, b).catch(console.error);
  };

  // ─── Investments ──────────────────────────────────────────────────────────────
  const addInvestment = (i: Omit<Investment, 'id'>) => {
    const newInv: Investment = { ...i, id: uuidv4() };
    const extraTx: Transaction | null = i.withdrawnAmount && i.withdrawnAmount > 0
      ? { id: uuidv4(), amount: i.withdrawnAmount, category: 'cat_investment', date: i.date, description: `Aporte: ${i.name}`, status: 'paid', type: 'expense' }
      : null;

    setState(s => ({
      ...s,
      investments: [...s.investments, newInv],
      transactions: extraTx ? [...s.transactions, extraTx] : s.transactions,
    }));

    api.createInvestment(newInv).catch(console.error);
    if (extraTx) api.createTransaction(extraTx).catch(console.error);
  };

  const updateInvestment = (id: string, i: Partial<Investment>) => {
    setState(s => ({ ...s, investments: s.investments.map(inv => inv.id === id ? { ...inv, ...i } : inv) }));
    api.updateInvestment(id, i).catch(console.error);
  };

  const deleteInvestment = (id: string) => {
    setState(s => ({ ...s, investments: s.investments.filter(inv => inv.id !== id) }));
    api.deleteInvestment(id).catch(console.error);
  };

  // ─── Recurring Bills Processing ───────────────────────────────────────────────
  const processRecurringBills = async () => {
    const s = stateRef.current;
    const now = new Date();
    const newTxs: Transaction[] = [];

    s.recurringBills.filter(b => b.status === 'active').forEach(bill => {
      const startD = bill.startDate ? parseISO(bill.startDate) : now;
      const endD   = bill.endDate ? endOfMonth(parseISO(bill.endDate)) : addMonths(now, 12);
      const maxD   = addMonths(now, 12);

      let currentMonth = startOfMonth(startD);

      while (!isAfter(currentMonth, endD) && !isAfter(currentMonth, maxD)) {
        const targetMonth = currentMonth;
        const exists = s.transactions.some(
          t => t.recurringBillId === bill.id && isSameMonth(parseISO(t.date), targetMonth)
        );
        if (!exists) {
          const dueDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), bill.dueDay, 12, 0, 0);
          newTxs.push({
            id: uuidv4(),
            amount: bill.amount,
            category: bill.category,
            date: dueDate.toISOString(),
            description: bill.name,
            status: 'pending',
            type: bill.type,
            isRecurring: true,
            recurringBillId: bill.id,
          });
        }
        currentMonth = addMonths(currentMonth, 1);
      }
    });

    if (newTxs.length === 0) return;

    try {
      const created = await api.createTransactionsBatch(newTxs);
      setState(s => ({ ...s, transactions: [...s.transactions, ...created] }));
    } catch (err) {
      console.error('Failed to persist recurring bill transactions:', err);
    }
  };

  // ─── Reset ────────────────────────────────────────────────────────────────────
  const resetWallet = async () => {
    await api.resetAll();
    window.location.reload();
  };

  return (
    <FinanceContext.Provider value={{
      ...state,
      loading,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addRecurringBill,
      updateRecurringBill,
      deleteRecurringBill,
      addBudget,
      updateBudget,
      addInvestment,
      updateInvestment,
      deleteInvestment,
      processRecurringBills,
      resetWallet,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
