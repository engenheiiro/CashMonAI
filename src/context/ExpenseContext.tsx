import React, { createContext, useContext, useState, useEffect } from "react";
import { Transaction, Category, Goal, Wallet, CreditCard, CATEGORIES as DEFAULT_CATEGORIES } from "../types";
import { toast } from "sonner";

interface ExpenseContextType {
  transactions: Transaction[];
  allTransactions: Transaction[];
  isLoading: boolean;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<boolean>;
  updateTransaction: (id: string, transaction: Omit<Transaction, "id">) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAllTransactions: () => Promise<void>;
  balance: number;
  projectedBalance: number;
  periodBalance: number;
  totalIncome: number;
  totalExpense: number;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  budgets: Record<string, number>;
  updateBudget: (categoryId: string, amount: number) => Promise<void>;
  categories: Category[];
  addCategory: (category: Omit<Category, "id">) => Promise<void>;
  updateCategory: (id: string, category: Omit<Category, "id">) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  goals: Goal[];
  addGoal: (goal: Omit<Goal, "id">) => Promise<void>;
  updateGoal: (id: string, goal: Omit<Goal, "id">) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addFundsToGoal: (id: string, amount: number, walletId?: string) => Promise<void>;
  wallets: Wallet[];
  activeWalletId: string | null;
  setActiveWalletId: (id: string | null) => void;
  addWallet: (name: string) => Promise<void>;
  updateWallet: (id: string, name: string) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  creditCards: CreditCard[];
  addCreditCard: (card: Omit<CreditCard, "id">) => Promise<void>;
  updateCreditCard: (id: string, card: Omit<CreditCard, "id">) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
  minimumBalance: number;
  setMinimumBalance: (amount: number) => Promise<void>;
  categoryFilter: string | null;
  setCategoryFilter: (categoryId: string | null) => void;
  resetAllData: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [minimumBalance, setMinimumBalanceState] = useState<number>(0);
  
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tRes, wRes, cRes, gRes, ccRes, sRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/wallets"),
        fetch("/api/categories"),
        fetch("/api/goals"),
        fetch("/api/credit-cards"),
        fetch("/api/settings")
      ]);

      const [tData, wData, cData, gData, ccData, sData] = await Promise.all([
        tRes.json(), wRes.json(), cRes.json(), gRes.json(), ccRes.json(), sRes.json()
      ]);

      setTransactions(tData);
      setWallets(wData.length > 0 ? wData : [{ id: "default", name: "Carteira Principal" }]);
      setCategories(cData.length > 0 ? cData : DEFAULT_CATEGORIES);
      setGoals(gData);
      setCreditCards(ccData);
      setBudgets(sData.budgets || {});
      setMinimumBalanceState(sData.minimumBalance || 0);
      
      if (wData.length > 0 && !activeWalletId) {
        setActiveWalletId(wData[0].id);
      } else if (!activeWalletId) {
        setActiveWalletId("default");
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addTransaction = async (transaction: Omit<Transaction, "id">) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...transaction, walletId: transaction.walletId || activeWalletId || "default" })
      });
      if (res.ok) {
        await fetchData();
        toast.success("Transação salva com sucesso!");
        return true;
      }
    } catch (error) {
      toast.error("Erro ao salvar transação.");
    }
    return false;
  };

  const updateTransaction = async (id: string, updatedTransaction: Omit<Transaction, "id">) => {
    try {
      // We need the MongoDB _id for the PUT request if we use findByIdAndUpdate
      // But our frontend uses a custom 'id' field. 
      // Let's find the document by its custom 'id' in the server or use the MongoDB _id.
      // For simplicity, let's assume the server handles finding by the custom id or we pass the _id.
      // Actually, my server.ts uses findByIdAndUpdate(req.params.id) which expects the MongoDB _id.
      // I should probably change the server to find by the custom 'id' or pass the _id.
      
      // Let's find the transaction in state to get its _id if it exists
      const existing = transactions.find(t => t.id === id) as any;
      const mongoId = existing?._id || id;

      const res = await fetch(`/api/transactions/${mongoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTransaction)
      });
      if (res.ok) {
        await fetchData();
        toast.success("Transação atualizada!");
        return true;
      }
    } catch (error) {
      toast.error("Erro ao atualizar transação.");
    }
    return false;
  };

  const deleteTransaction = async (id: string) => {
    try {
      const existing = transactions.find(t => t.id === id) as any;
      const mongoId = existing?._id || id;
      const res = await fetch(`/api/transactions/${mongoId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
        toast.success("Transação excluída.");
      }
    } catch (error) {
      toast.error("Erro ao excluir transação.");
    }
  };

  const clearAllTransactions = async () => {
    try {
      const res = await fetch("/api/transactions", { method: "DELETE" });
      if (res.ok) {
        await fetchData();
        toast.success("Todas as transações foram excluídas.");
      }
    } catch (error) {
      toast.error("Erro ao excluir transações.");
    }
  };

  const addWallet = async (name: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name })
      });
      if (res.ok) {
        await fetchData();
        toast.success("Carteira criada com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao criar carteira.");
    }
  };

  const updateWallet = async (id: string, name: string) => {
    // Similar to transactions, we'd need to handle IDs carefully.
    // For now, let's just implement the basic fetch.
    toast.info("Funcionalidade em migração para MongoDB.");
  };

  const deleteWallet = async (id: string) => {
    try {
      const res = await fetch(`/api/wallets/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
        toast.success("Carteira excluída.");
      }
    } catch (error) {
      toast.error("Erro ao excluir carteira.");
    }
  };

  const addCategory = async (category: Omit<Category, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...category, id })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      toast.error("Erro ao criar categoria.");
    }
  };

  const updateCategory = async (id: string, updatedCategory: Omit<Category, "id">) => {
    toast.info("Funcionalidade em migração.");
  };

  const deleteCategory = async (id: string) => {
    toast.info("Funcionalidade em migração.");
  };

  const addGoal = async (goal: Omit<Goal, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...goal, id })
      });
      if (res.ok) {
        if (goal.currentAmount > 0) {
          await addTransaction({
            amount: goal.currentAmount,
            type: "expense",
            categoryId: "investment",
            date: new Date().toISOString(),
            note: `Aporte Inicial Meta: ${goal.name}`,
            walletId: activeWalletId || "default",
            status: 'paid'
          });
        }
        await fetchData();
        toast.success("Meta criada!");
      }
    } catch (error) {
      toast.error("Erro ao criar meta.");
    }
  };

  const updateGoal = async (id: string, updatedGoal: Omit<Goal, "id">) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedGoal)
      });
      if (res.ok) {
        await fetchData();
        toast.success("Meta atualizada!");
      }
    } catch (error) {
      toast.error("Erro ao atualizar meta.");
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
        toast.success("Meta removida.");
      }
    } catch (error) {
      toast.error("Erro ao excluir meta.");
    }
  };

  const addFundsToGoal = async (id: string, amount: number, walletId?: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAmount: goal.currentAmount + amount })
      });
      if (res.ok) {
        await addTransaction({
          amount: amount,
          type: "expense",
          categoryId: "investment",
          date: new Date().toISOString(),
          note: `Aporte Meta: ${goal.name}`,
          walletId: walletId || activeWalletId || "default",
          status: 'paid'
        });
        await fetchData();
      }
    } catch (error) {
      toast.error("Erro ao adicionar fundos.");
    }
  };

  const addCreditCard = async (card: Omit<CreditCard, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const res = await fetch("/api/credit-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...card, id })
      });
      if (res.ok) {
        await fetchData();
        toast.success("Cartão adicionado!");
      }
    } catch (error) {
      toast.error("Erro ao adicionar cartão.");
    }
  };

  const updateCreditCard = async (id: string, updatedCard: Omit<CreditCard, "id">) => {
    toast.info("Funcionalidade em migração.");
  };

  const deleteCreditCard = async (id: string) => {
    try {
      const res = await fetch(`/api/credit-cards/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
        toast.success("Cartão removido.");
      }
    } catch (error) {
      toast.error("Erro ao excluir cartão.");
    }
  };

  const updateBudget = async (categoryId: string, amount: number) => {
    const newBudgets = { ...budgets, [categoryId]: amount };
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgets: newBudgets })
      });
      if (res.ok) {
        setBudgets(newBudgets);
      }
    } catch (error) {
      toast.error("Erro ao atualizar orçamento.");
    }
  };

  const setMinimumBalance = async (amount: number) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minimumBalance: amount })
      });
      if (res.ok) {
        setMinimumBalanceState(amount);
      }
    } catch (error) {
      toast.error("Erro ao atualizar saldo mínimo.");
    }
  };

  const resetAllData = async () => {
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (res.ok) {
        localStorage.clear();
        window.location.reload();
      }
    } catch (error) {
      toast.error("Erro ao resetar dados.");
    }
  };

  // Derived state (remains same)
  const walletTransactions = activeWalletId
    ? transactions.filter((t) => t.walletId === activeWalletId)
    : transactions;

  const filteredTransactions = walletTransactions.filter((t) => {
    if (selectedMonth === "all") return true;
    const date = new Date(t.date);
    if (selectedMonth.length === 4) return date.getFullYear().toString() === selectedMonth;
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return monthStr === selectedMonth;
  }).filter((t) => {
    if (!categoryFilter) return true;
    return t.categoryId === categoryFilter;
  });

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const periodBalance = totalIncome - totalExpense;

  const balance = walletTransactions.filter((t) => {
    if (selectedMonth === "all") return true;
    const tDate = new Date(t.date);
    if (selectedMonth.length === 4) {
      const year = Number(selectedMonth);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
      return tDate.getTime() <= endOfYear.getTime();
    }
    const [year, month] = selectedMonth.split("-");
    const endOfMonth = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
    return tDate.getTime() <= endOfMonth.getTime();
  })
  .filter(t => t.status === 'paid' || t.status === undefined)
  .reduce((acc, curr) => acc + (curr.type === "income" ? curr.amount : -curr.amount), 0);

  const projectedBalance = walletTransactions.filter((t) => {
    if (selectedMonth === "all") return true;
    const tDate = new Date(t.date);
    if (selectedMonth.length === 4) {
      const year = Number(selectedMonth);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
      return tDate.getTime() <= endOfYear.getTime();
    }
    const [year, month] = selectedMonth.split("-");
    const endOfMonth = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
    return tDate.getTime() <= endOfMonth.getTime();
  }).reduce((acc, curr) => acc + (curr.type === "income" ? curr.amount : -curr.amount), 0);

  return (
    <ExpenseContext.Provider
      value={{
        transactions: filteredTransactions,
        allTransactions: walletTransactions,
        isLoading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        clearAllTransactions,
        balance,
        projectedBalance,
        periodBalance,
        totalIncome,
        totalExpense,
        selectedMonth,
        setSelectedMonth,
        budgets,
        updateBudget,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        addFundsToGoal,
        wallets,
        activeWalletId,
        setActiveWalletId,
        addWallet,
        updateWallet,
        deleteWallet,
        creditCards,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        minimumBalance,
        setMinimumBalance,
        categoryFilter,
        setCategoryFilter,
        resetAllData,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }
  return context;
};
