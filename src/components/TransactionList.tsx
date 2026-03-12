import React, { useState } from "react";
import {
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useExpenses } from "../context/ExpenseContext";
import { toast } from "sonner";
import { CATEGORIES, Transaction } from "../types";
import { Skeleton } from "./ui/skeleton";
import {
  Trash2,
  Edit2,
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Zap,
  Heart,
  Briefcase,
  MoreHorizontal,
  ArrowDownUp,
  Calendar as CalendarIcon,
  BookOpen,
  Home,
  Plane,
  TrendingUp,
  Pizza,
  ShoppingCart,
  Bus,
  Fuel,
  PartyPopper,
  Laptop,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Table as TableIcon,
  Plus,
  CreditCard as CreditCardIcon,
  SearchX,
} from "lucide-react";
import { Input } from "./ui/input";
import { EmptyState } from "./ui/EmptyState";

registerLocale("ptBR", ptBR);

const iconMap: Record<string, React.ReactNode> = {
  Utensils: <Utensils className="h-4 w-4" />,
  Car: <Car className="h-4 w-4" />,
  ShoppingBag: <ShoppingBag className="h-4 w-4" />,
  Film: <Film className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
  Briefcase: <Briefcase className="h-4 w-4" />,
  MoreHorizontal: <MoreHorizontal className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  Home: <Home className="h-4 w-4" />,
  Plane: <Plane className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  Pizza: <Pizza className="h-4 w-4" />,
  ShoppingCart: <ShoppingCart className="h-4 w-4" />,
  Bus: <Bus className="h-4 w-4" />,
  Fuel: <Fuel className="h-4 w-4" />,
  PartyPopper: <PartyPopper className="h-4 w-4" />,
  Laptop: <Laptop className="h-4 w-4" />,
};

type SortBy = "date" | "amount" | "category";
type SortOrder = "asc" | "desc";

export const TransactionList = ({
  onEdit,
  defaultView = "table",
  hideViewToggle = false,
  filterStatus,
  limit,
  hideFilters = false,
  compact = false,
}: {
  onEdit?: (t: Transaction) => void;
  defaultView?: "cards" | "table";
  hideViewToggle?: boolean;
  filterStatus?: 'paid' | 'pending';
  limit?: number;
  hideFilters?: boolean;
  compact?: boolean;
}) => {
  const { transactions, allTransactions, deleteTransaction, addTransaction, updateTransaction, creditCards, wallets, isLoading } = useExpenses();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">(defaultView);

  const currentViewMode = hideViewToggle ? defaultView : viewMode;

  const [visibleCount, setVisibleCount] = useState(10);

  // Inline Add State
  const [inlineAddType, setInlineAddType] = useState<"income" | "expense">("expense");
  const [inlineAddDate, setInlineAddDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [inlineAddCategory, setInlineAddCategory] = useState(CATEGORIES[0].id);
  const [inlineAddNote, setInlineAddNote] = useState("");
  const [inlineAddAmount, setInlineAddAmount] = useState("");

  const handleInlineAdd = () => {
    if (!inlineAddAmount || isNaN(Number(inlineAddAmount))) return;
    addTransaction({
      amount: Number(inlineAddAmount),
      type: inlineAddType,
      categoryId: inlineAddCategory,
      date: new Date(inlineAddDate).toISOString(),
      note: inlineAddNote,
    });
    setInlineAddAmount("");
    setInlineAddNote("");
    toast.success("Transação adicionada!");
  };

  const toggleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Calculate running balance based on ALL transactions chronologically
  const transactionsWithBalance = React.useMemo(() => {
    const sortedAll = [...allTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let currentBalance = 0;
    const balanceMap = new Map<string, number>();

    sortedAll.forEach((t) => {
      currentBalance += t.type === "income" ? t.amount : -t.amount;
      balanceMap.set(t.id, currentBalance);
    });

    return transactions.map((t) => ({
      ...t,
      runningBalance: balanceMap.get(t.id) || 0,
    }));
  }, [allTransactions, transactions]);

  const filteredAndSortedTransactions = transactionsWithBalance
    .filter((t) => {
      const currentStatus = t.status || 'paid';
      if (filterStatus && currentStatus !== filterStatus) return false;
      if (statusFilter !== "all" && currentStatus !== statusFilter) return false;
      if (selectedCategory && t.categoryId !== selectedCategory) return false;
      if (!startDate && !endDate) return true;
      const date = parseISO(t.date);
      const start = startDate ? startOfDay(startDate) : new Date(0);
      const end = endDate ? endOfDay(endDate) : new Date(8640000000000000);
      return isWithinInterval(date, { start, end });
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortBy === "category") {
        const catA = CATEGORIES.find((c) => c.id === a.categoryId)?.name || "";
        const catB = CATEGORIES.find((c) => c.id === b.categoryId)?.name || "";
        comparison = catA.localeCompare(catB);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const visibleTransactions = filteredAndSortedTransactions.slice(
    0,
    limit || visibleCount,
  );

  const handleMarkAsPaid = (e: React.MouseEvent, transaction: Transaction) => {
    e.stopPropagation();
    const { id, ...rest } = transaction;
    updateTransaction(id, { ...rest, status: 'paid' });
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-6"}>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-3xl" />
          ))}
        </div>
      ) : visibleTransactions.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="Nenhuma transação encontrada"
          description="Não encontramos transações para os filtros selecionados. Tente ajustar o período ou a categoria."
        />
      )}
      
      {!hideFilters && visibleTransactions.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Transações Recentes
            </h3>
            {!hideViewToggle && (
              <div className="flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`rounded-md p-1.5 transition-colors ${currentViewMode === "table" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
                  title="Visão em Planilha"
                >
                  <TableIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`rounded-md p-1.5 transition-colors ${currentViewMode === "cards" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
                  title="Visão em Cartões"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-2xl bg-white dark:bg-zinc-900 p-1 ring-1 ring-zinc-200 dark:ring-zinc-800">
              <div className="relative flex items-center">
                <CalendarIcon className="absolute left-3 h-4 w-4 text-zinc-400 z-10" />
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  locale="ptBR"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Início"
                  className="h-9 w-[130px] border-none bg-transparent pl-9 text-xs focus-visible:ring-0 outline-none dark:text-zinc-50"
                />
              </div>
              <span className="text-zinc-300 dark:text-zinc-600">-</span>
              <div className="relative flex items-center">
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || undefined}
                  locale="ptBR"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Fim"
                  className="h-9 w-[130px] border-none bg-transparent px-3 text-xs focus-visible:ring-0 outline-none dark:text-zinc-50"
                />
              </div>
              <div className="relative flex items-center">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-9 rounded-2xl border-none bg-transparent px-3 text-xs focus-visible:ring-0 outline-none text-zinc-600 dark:text-zinc-400"
                >
                  <option value="">Todas as Categorias</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative flex items-center">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 rounded-2xl border-none bg-transparent px-3 text-xs focus-visible:ring-0 outline-none text-zinc-600 dark:text-zinc-400"
                >
                  <option value="all">Todos os Status</option>
                  <option value="paid">Pagas</option>
                  <option value="pending">Pendentes</option>
                </select>
              </div>
              {(startDate || endDate || selectedCategory || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setStartDate(null);
                    setEndDate(null);
                    setSelectedCategory("");
                    setStatusFilter("all");
                  }}
                  className="ml-2 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!hideFilters && transactions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 py-1.5">Ordenar por:</span>
          <button
            onClick={() => toggleSort("date")}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${sortBy === "date" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"}`}
          >
            Data {sortBy === "date" && <ArrowDownUp className="h-3 w-3" />}
          </button>
          <button
            onClick={() => toggleSort("amount")}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${sortBy === "amount" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"}`}
          >
            Valor {sortBy === "amount" && <ArrowDownUp className="h-3 w-3" />}
          </button>
          <button
            onClick={() => toggleSort("category")}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${sortBy === "category" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"}`}
          >
            Categoria{" "}
            {sortBy === "category" && <ArrowDownUp className="h-3 w-3" />}
          </button>
        </div>
      )}

      {filteredAndSortedTransactions.length === 0 && currentViewMode === "cards" ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
          <div className="mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 p-4">
            <ShoppingBag className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p>Nenhuma transação encontrada.</p>
          {transactions.length === 0 && (
            <p className="text-sm">Adicione uma para começar!</p>
          )}
        </div>
      ) : currentViewMode === "cards" ? (
        <div className="space-y-3">
          {visibleTransactions.map((transaction, index) => {
            const category =
              CATEGORIES.find((c) => c.id === transaction.categoryId) ||
              CATEGORIES[CATEGORIES.length - 1];

            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group flex flex-col rounded-3xl bg-white dark:bg-zinc-900 ${compact ? 'p-3' : 'p-4'} shadow-sm ring-1 ring-zinc-100 dark:ring-zinc-800 transition-all hover:shadow-md cursor-pointer ${transaction.status === 'pending' ? 'border-l-4 border-orange-500 opacity-80' : ''}`}
                onClick={() => onEdit?.(transaction)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className={`flex ${compact ? 'h-10 w-10' : 'h-12 w-12'} items-center justify-center rounded-2xl ${transaction.status === 'pending' ? 'grayscale-[0.5]' : ''}`}
                      style={{
                        backgroundColor: `${category.color}15`,
                        color: category.color,
                      }}
                    >
                      <div className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} flex items-center justify-center [&>svg]:h-full [&>svg]:w-full`}>
                        {iconMap[category.icon]}
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`font-medium ${compact ? 'text-sm' : ''} ${transaction.status === 'pending' ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-900 dark:text-zinc-50'}`}>
                          {transaction.note || category.name}
                        </p>
                        {transaction.isRecurring && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-medium">
                            Recorrente
                          </span>
                        )}
                        {transaction.installment && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-medium">
                            Parcela {transaction.installment.current}/{transaction.installment.total}
                          </span>
                        )}
                        {transaction.isFixed && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-medium">
                            Fixo
                          </span>
                        )}
                        {transaction.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-medium">
                            Pendente
                          </span>
                        )}
                        {transaction.creditCardId && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 text-[10px] font-medium flex items-center gap-1">
                            <CreditCardIcon className="h-3 w-3" />
                            {creditCards.find(c => c.id === transaction.creditCardId)?.name || 'Cartão'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {format(
                          new Date(transaction.date),
                          "dd 'de' MMM, yyyy",
                          {
                            locale: ptBR,
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4">
                    <span
                      className={`font-semibold font-tabular ${compact ? 'text-sm' : ''} ${
                        transaction.type === "income"
                          ? "text-emerald-500"
                          : transaction.status === 'pending' ? "text-orange-500" : "text-zinc-900 dark:text-zinc-50"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}R$
                      {transaction.amount.toFixed(2)}
                    </span>
                    
                    {transaction.status === 'pending' && (
                      <button
                        onClick={(e) => handleMarkAsPaid(e, transaction)}
                        className={`flex items-center gap-1 rounded-full bg-emerald-500/10 ${compact ? 'px-2 py-0.5' : 'px-3 py-1'} text-[10px] font-bold text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all`}
                      >
                        Pagar
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(transaction);
                      }}
                      className="rounded-full p-2 text-zinc-400 opacity-0 transition-all hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-500/10 group-hover:opacity-100"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            "Tem certeza que deseja excluir esta transação?",
                          )
                        ) {
                          deleteTransaction(transaction.id);
                        }
                      }}
                      className="rounded-full p-2 text-zinc-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {visibleCount < filteredAndSortedTransactions.length && (
            <div className="pt-4 text-center">
              <button
                onClick={handleLoadMore}
                className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-6 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Carregar mais
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium text-right">Entrada (R$)</th>
                  <th className="px-4 py-3 font-medium text-right">Saída (R$)</th>
                  <th className="px-4 py-3 font-medium text-right">Saldo Corr. (R$)</th>
                  <th className="px-4 py-3 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {/* Inline Add Row */}
                <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b-2 border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-2">
                    <Input 
                      type="date" 
                      value={inlineAddDate} 
                      onChange={(e) => setInlineAddDate(e.target.value)} 
                      className="h-8 text-xs w-[130px] bg-white dark:bg-zinc-950" 
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select 
                      value={inlineAddCategory} 
                      onChange={(e) => setInlineAddCategory(e.target.value)} 
                      className="h-8 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-300 outline-none"
                    >
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <Input 
                      placeholder="Descrição rápida..." 
                      value={inlineAddNote} 
                      onChange={(e) => setInlineAddNote(e.target.value)} 
                      className="h-8 text-xs bg-white dark:bg-zinc-950" 
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input 
                      type="number" 
                      placeholder="R$ 0,00" 
                      value={inlineAddType === 'income' ? inlineAddAmount : ''} 
                      onChange={(e) => { setInlineAddType('income'); setInlineAddAmount(e.target.value); }} 
                      className="h-8 text-xs text-right bg-white dark:bg-zinc-950 focus-visible:ring-emerald-500" 
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input 
                      type="number" 
                      placeholder="R$ 0,00" 
                      value={inlineAddType === 'expense' ? inlineAddAmount : ''} 
                      onChange={(e) => { setInlineAddType('expense'); setInlineAddAmount(e.target.value); }} 
                      className="h-8 text-xs text-right bg-white dark:bg-zinc-950 focus-visible:ring-red-500" 
                    />
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-zinc-400">
                    -
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button 
                      onClick={handleInlineAdd}
                      disabled={!inlineAddAmount}
                      className="p-1.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mx-auto block"
                      title="Adicionar Transação"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </td>
                </tr>

                {visibleTransactions.map((transaction, index) => {
                  const category =
                    CATEGORIES.find((c) => c.id === transaction.categoryId) ||
                    CATEGORIES[CATEGORIES.length - 1];

                  return (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer ${
                        transaction.type === "income" 
                          ? "bg-emerald-50/30 dark:bg-emerald-950/10" 
                          : "bg-red-50/30 dark:bg-red-950/10"
                      }`}
                      onClick={() => onEdit?.(transaction)}
                    >
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                        {format(new Date(transaction.date), "dd/MM/yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-6 w-6 items-center justify-center rounded-md"
                            style={{
                              backgroundColor: `${category.color}15`,
                              color: category.color,
                            }}
                          >
                            {React.cloneElement(iconMap[category.icon] as React.ReactElement<any>, { className: "h-3 w-3" })}
                          </div>
                          <span className="text-zinc-700 dark:text-zinc-200 font-medium">
                            {transaction.type === "income" ? "Receita" : "Despesa"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 min-w-[150px]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{transaction.note || category.name}</span>
                          {transaction.isRecurring && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-medium">
                              Recorrente
                            </span>
                          )}
                          {transaction.installment && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-medium">
                              Parcela {transaction.installment.current}/{transaction.installment.total}
                            </span>
                          )}
                          {transaction.isFixed && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-medium">
                              Fixo
                            </span>
                          )}
                          {transaction.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-medium">
                              Pendente
                            </span>
                          )}
                          {transaction.creditCardId && (
                            <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 text-[10px] font-medium flex items-center gap-1">
                              <CreditCardIcon className="h-3 w-3" />
                              {creditCards.find(c => c.id === transaction.creditCardId)?.name || 'Cartão'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400 font-tabular">
                        {transaction.type === "income" ? transaction.amount.toFixed(2) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-600 dark:text-red-400 font-tabular">
                        {transaction.type === "expense" ? transaction.amount.toFixed(2) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-50 font-tabular">
                        {transaction.runningBalance.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {transaction.status === 'pending' && (
                            <button
                              onClick={(e) => handleMarkAsPaid(e, transaction)}
                              className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md transition-colors"
                              title="Marcar como Pago"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit?.(transaction);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
                                deleteTransaction(transaction.id);
                              }
                            }}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {visibleCount < filteredAndSortedTransactions.length && (
            <div className="p-4 text-center border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={handleLoadMore}
                className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-6 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Carregar mais
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
