import React, { useState, useEffect } from "react";
import { ExpenseProvider, useExpenses } from "./context/ExpenseContext";
import { Dashboard } from "./components/Dashboard";
import { TransactionList } from "./components/TransactionList";
import { AddTransactionModal } from "./components/AddTransactionModal";
import { SettingsPanel } from "./components/SettingsPanel";
import { CreditCardsPanel } from "./components/CreditCardsPanel";
import { Button } from "./components/ui/button";
import { Plus, Moon, Sun, LayoutDashboard, TableProperties, Settings, Wallet as WalletIcon, CreditCard as CreditCardIcon, Target } from "lucide-react";
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

import { Transaction } from "./types";
import { GoalsPanel } from "./components/GoalsPanel";
import { ErrorBoundary } from "./components/ErrorBoundary";

function AppContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] =
    useState<Transaction | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState<"dashboard" | "planilha" | "cartoes" | "metas" | "ajustes">("dashboard");

  const { 
    wallets, 
    activeWalletId, 
    setActiveWalletId, 
    transactions,
    selectedMonth 
  } = useExpenses();

  const pendingTransactions = transactions.filter(t => {
    const isPending = t.status === 'pending';
    const isWalletMatch = !activeWalletId || t.walletId === activeWalletId;
    const isMonthMatch = selectedMonth === 'all' || t.date.startsWith(selectedMonth);
    return isPending && isWalletMatch && isMonthMatch;
  });

  const totalPending = pendingTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Check for upcoming bills
    const checkUpcomingBills = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);

      const upcomingBills = transactions.filter(t => {
        if (t.type !== 'expense' || t.status === 'paid') return false;
        
        const tDate = new Date(t.date);
        tDate.setHours(0, 0, 0, 0);
        
        return tDate >= today && tDate <= threeDaysFromNow;
      });

      if (upcomingBills.length > 0) {
        // Show toast notification
        toast.warning(`Você tem ${upcomingBills.length} conta(s) vencendo nos próximos 3 dias!`, {
          duration: 10000,
          action: {
            label: 'Ver',
            onClick: () => setActiveTab('planilha')
          }
        });

        // Request browser notification permission and show
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("CashMon AI - Lembrete", {
            body: `Você tem ${upcomingBills.length} conta(s) vencendo nos próximos 3 dias!`,
            icon: "/favicon.ico" // Assuming there's a favicon
          });
        } else if ("Notification" in window && Notification.permission !== "denied") {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              new Notification("CashMon AI - Lembrete", {
                body: `Você tem ${upcomingBills.length} conta(s) vencendo nos próximos 3 dias!`,
              });
            }
          });
        }
      }
    };

    // Run once on mount
    const hasCheckedToday = localStorage.getItem('flow-checked-bills-date');
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (hasCheckedToday !== todayStr) {
      checkUpcomingBills();
      localStorage.setItem('flow-checked-bills-date', todayStr);
    }
  }, [transactions]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-950 dark:text-zinc-50 selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900 transition-colors">
      <Toaster theme={isDarkMode ? "dark" : "light"} />
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 px-6 py-4 backdrop-blur-md transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
                <span className="font-bold">C</span>
              </div>
              <h1 className="text-xl font-semibold tracking-tight">
                Cash<span className="text-emerald-500">Mon</span>{" "}
                <span className="font-light">AI</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 py-1.5 px-3 rounded-xl">
                <WalletIcon className="h-4 w-4 text-zinc-500" />
                <select
                  value={activeWalletId || ""}
                  onChange={(e) => setActiveWalletId(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none cursor-pointer text-zinc-900 dark:text-zinc-50 [&>option]:bg-white [&>option]:dark:bg-zinc-900"
                >
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div className="hidden md:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "dashboard"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Painel
              </button>
              <button
                onClick={() => setActiveTab("planilha")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "planilha"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
              >
                <TableProperties className="h-4 w-4" />
                Planilha
              </button>
              <button
                onClick={() => setActiveTab("cartoes")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "cartoes"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
              >
                <CreditCardIcon className="h-4 w-4" />
                Cartões
              </button>
              <button
                onClick={() => setActiveTab("metas")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "metas"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
              >
                <Target className="h-4 w-4" />
                Metas
              </button>
              <button
                onClick={() => setActiveTab("ajustes")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "ajustes"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
              >
                <Settings className="h-4 w-4" />
                Ajustes
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Button
              onClick={() => {
                setTransactionToEdit(null);
                setIsModalOpen(true);
              }}
              className="gap-2 rounded-full shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova Transação</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Main Analytics */}
              <div className="lg:col-span-8 space-y-8">
                <Dashboard />
              </div>

              {/* Right Column: Actionable Items */}
              <div className="lg:col-span-4 space-y-8">
                {/* Contas a Pagar Section - High Priority */}
                <section className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 ring-1 ring-orange-500/10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <TableProperties className="h-5 w-5 text-orange-500" />
                        Contas a Pagar
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Total: <span className="font-semibold text-orange-500">R$ {totalPending.toFixed(2)}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setTransactionToEdit(null);
                        setIsModalOpen(true);
                      }}
                      className="h-10 w-10 rounded-2xl bg-orange-500/10 flex items-center justify-center hover:bg-orange-500/20 transition-colors"
                      title="Nova Conta Pendente"
                    >
                      <Plus className="h-5 w-5 text-orange-500" />
                    </button>
                  </div>
                  
                  <TransactionList
                    filterStatus="pending"
                    defaultView="cards"
                    limit={4}
                    hideFilters={true}
                    hideViewToggle={true}
                    compact={true}
                    onEdit={(t) => {
                      setTransactionToEdit(t);
                      setIsModalOpen(true);
                    }}
                  />
                  
                  {pendingTransactions.length > 4 && (
                    <button 
                      onClick={() => setActiveTab("planilha")}
                      className="w-full mt-4 py-2 text-[10px] font-bold uppercase tracking-tighter text-zinc-400 hover:text-orange-500 transition-colors border-t border-zinc-100 dark:border-zinc-800"
                    >
                      Ver todas as {pendingTransactions.length} pendências
                    </button>
                  )}
                  
                  {pendingTransactions.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-sm text-zinc-400 italic">Nenhuma conta pendente para este período! 🎉</p>
                    </div>
                  )}
                </section>

                {/* Recent Transactions Section */}
                <section>
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm uppercase tracking-widest">Recentes</h3>
                    <button 
                      onClick={() => setActiveTab("planilha")}
                      className="text-xs text-emerald-500 font-medium hover:underline"
                    >
                      Ver tudo
                    </button>
                  </div>
                  <TransactionList
                    onEdit={(t) => {
                      setTransactionToEdit(t);
                      setIsModalOpen(true);
                    }}
                    defaultView="cards"
                    hideViewToggle={true}
                    limit={5}
                    hideFilters={true}
                    compact={true}
                  />
                </section>
              </div>
            </motion.div>
          )}
          
          {activeTab === "planilha" && (
            <motion.div
              key="planilha"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <TransactionList
                onEdit={(t) => {
                  setTransactionToEdit(t);
                  setIsModalOpen(true);
                }}
                defaultView="table"
                hideViewToggle={true}
              />
            </motion.div>
          )}

          {activeTab === "cartoes" && (
            <motion.div
              key="cartoes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <CreditCardsPanel />
            </motion.div>
          )}

          {activeTab === "metas" && (
            <motion.div
              key="metas"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <GoalsPanel />
            </motion.div>
          )}

          {activeTab === "ajustes" && (
            <motion.div
              key="ajustes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl mx-auto"
            >
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
                <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Ajustes e Personalização</h2>
                <SettingsPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Tab Navigation (Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 z-40 flex justify-center gap-2">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-1 items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "dashboard"
              ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          Painel
        </button>
        <button
          onClick={() => setActiveTab("planilha")}
          className={`flex flex-1 items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "planilha"
              ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          <TableProperties className="h-5 w-5" />
          <span className="hidden sm:inline">Planilha</span>
        </button>
        <button
          onClick={() => setActiveTab("cartoes")}
          className={`flex flex-1 items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "cartoes"
              ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          <CreditCardIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Cartões</span>
        </button>
        <button
          onClick={() => setActiveTab("metas")}
          className={`flex flex-1 items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "metas"
              ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          <Target className="h-5 w-5" />
          <span className="hidden sm:inline">Metas</span>
        </button>
        <button
          onClick={() => setActiveTab("ajustes")}
          className={`flex flex-1 items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "ajustes"
              ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          <Settings className="h-5 w-5" />
          <span className="hidden sm:inline">Ajustes</span>
        </button>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTimeout(() => setTransactionToEdit(null), 300);
        }}
        transactionToEdit={transactionToEdit}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ExpenseProvider>
        <AppContent />
      </ExpenseProvider>
    </ErrorBoundary>
  );
}
