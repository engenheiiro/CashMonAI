import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { format, addMonths } from "date-fns";
import { toast } from "sonner";
import {
  X,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Zap,
  Heart,
  Briefcase,
  MoreHorizontal,
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
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { CATEGORIES, TransactionType, Transaction } from "../types";
import { useExpenses } from "../context/ExpenseContext";

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

const SUGGESTIONS: Record<string, string> = {
  uber: "uber",
  "99": "uber",
  taxi: "uber",
  ifood: "ifood",
  rappi: "ifood",
  pizza: "ifood",
  lanche: "ifood",
  mercado: "supermarket",
  supermercado: "supermarket",
  carrefour: "supermarket",
  extra: "supermarket",
  gasolina: "fuel",
  etanol: "fuel",
  posto: "fuel",
  cinema: "cinema",
  filme: "cinema",
  ingresso: "cinema",
  shopping: "shopping",
  roupa: "shopping",
  zara: "shopping",
  renner: "shopping",
  luz: "bills",
  agua: "bills",
  internet: "bills",
  salario: "salary",
  pagamento: "salary",
  freela: "freelance",
  viagem: "travel",
  passagem: "travel",
  hotel: "travel",
  farmacia: "health",
  remedio: "health",
  medico: "health",
};

export const AddTransactionModal = ({
  isOpen,
  onClose,
  transactionToEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}) => {
  const { addTransaction, updateTransaction, transactions, wallets, creditCards, activeWalletId } = useExpenses();
  const [type, setType] = useState<TransactionType>(
    transactionToEdit?.type || "expense",
  );
  const [amount, setAmount] = useState(
    transactionToEdit?.amount.toString() || "",
  );
  const [categoryId, setCategoryId] = useState(
    transactionToEdit?.categoryId || CATEGORIES[0].id,
  );
  const [note, setNote] = useState(transactionToEdit?.note || "");
  const [date, setDate] = useState(
    transactionToEdit
      ? format(new Date(transactionToEdit.date), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
  );
  const [isRecurring, setIsRecurring] = useState(false);
  const [installments, setInstallments] = useState(2);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(
    null,
  );
  const [creditCardId, setCreditCardId] = useState<string | undefined>(
    transactionToEdit?.creditCardId || undefined
  );
  const [walletId, setWalletId] = useState<string | undefined>(
    transactionToEdit?.walletId || activeWalletId || undefined
  );
  const [status, setStatus] = useState<'paid' | 'pending'>(
    transactionToEdit?.status || 'paid'
  );
  const [isFixed, setIsFixed] = useState(
    transactionToEdit?.isFixed || false
  );

  React.useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      setCategoryId(transactionToEdit.categoryId);
      setNote(transactionToEdit.note || "");
      setDate(format(new Date(transactionToEdit.date), "yyyy-MM-dd"));
      setIsRecurring(false);
      setInstallments(2);
      setCreditCardId(transactionToEdit.creditCardId);
      setWalletId(transactionToEdit.walletId);
      setStatus(transactionToEdit.status || 'paid');
      setIsFixed(transactionToEdit.isFixed || false);
    } else {
      setType("expense");
      setAmount("");
      setCategoryId(CATEGORIES[0].id);
      setNote("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setIsRecurring(false);
      setInstallments(2);
      setCreditCardId(undefined);
      setWalletId(activeWalletId || undefined);
      setStatus('paid');
      setIsFixed(false);
    }
  }, [transactionToEdit, isOpen, activeWalletId]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNote = e.target.value;
    setNote(newNote);

    const words = newNote.toLowerCase().split(/\s+/);
    let found = null;
    for (const word of words) {
      if (SUGGESTIONS[word]) {
        found = SUGGESTIONS[word];
        break;
      }
    }

    if (found && found !== categoryId) {
      setSuggestedCategory(found);
    } else {
      setSuggestedCategory(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    if (transactionToEdit) {
      updateTransaction(transactionToEdit.id, {
        amount: Number(amount),
        type,
        categoryId,
        date: new Date(date).toISOString(),
        note,
      });
    } else {
      const isDuplicate = transactions.some(
        (t) =>
          t.amount === Number(amount) &&
          t.type === type &&
          t.categoryId === categoryId &&
          t.note === note &&
          new Date().getTime() - new Date(t.date).getTime() < 60000,
      );

      if (isDuplicate) {
        if (
          !window.confirm(
            "Uma transação idêntica foi adicionada há menos de 1 minuto. Deseja adicionar novamente?",
          )
        ) {
          return;
        }
      }

      if (isRecurring && installments > 1) {
        const baseDate = new Date(date);
        const installmentAmount = Number(amount) / installments;
        for (let i = 0; i < installments; i++) {
          addTransaction({
            amount: installmentAmount,
            type,
            categoryId,
            date: addMonths(baseDate, i).toISOString(),
            note: note || CATEGORIES.find(c => c.id === categoryId)?.name || "",
            installment: { current: i + 1, total: installments },
            creditCardId,
            walletId,
            status,
            isFixed: false,
          });
        }
      } else if (isFixed && installments > 1) {
        const baseDate = new Date(date);
        for (let i = 0; i < installments; i++) {
          addTransaction({
            amount: Number(amount),
            type,
            categoryId,
            date: addMonths(baseDate, i).toISOString(),
            note: note || CATEGORIES.find(c => c.id === categoryId)?.name || "",
            creditCardId,
            walletId,
            status: i === 0 ? status : 'pending', // Only the first one respects the chosen status, others are pending
            isFixed: true,
          });
        }
      } else {
        addTransaction({
          amount: Number(amount),
          type,
          categoryId,
          date: new Date(date).toISOString(),
          note,
          creditCardId,
          walletId,
          status,
          isFixed,
        });
      }
    }

    setAmount("");
    setNote("");
    setSuggestedCategory(null);
    setIsRecurring(false);
    setInstallments(2);
    setDate(format(new Date(), "yyyy-MM-dd"));
    setCreditCardId(undefined);
    setWalletId(activeWalletId || undefined);
    setStatus('paid');
    setIsFixed(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="overflow-y-auto max-h-[90vh] rounded-3xl bg-white dark:bg-zinc-950 p-6 shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {transactionToEdit ? "Editar Transação" : "Nova Transação"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex rounded-2xl bg-zinc-100 dark:bg-zinc-900 p-1">
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all ${
                      type === "expense"
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("income")}
                    className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all ${
                      type === "income"
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    Receita
                  </button>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Valor
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                      R$
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-10 text-lg"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Categoria
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {CATEGORIES.filter((c) =>
                      type === "income"
                        ? c.id === "salary" || c.id === "other"
                        : c.id !== "salary",
                    ).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-2 transition-all ${
                          categoryId === cat.id
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                            : "bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor:
                              categoryId === cat.id
                                ? "transparent"
                                : `${cat.color}20`,
                            color: categoryId === cat.id ? "white" : cat.color,
                          }}
                        >
                          {iconMap[cat.icon]}
                        </div>
                        <span className="text-[10px] font-medium text-center leading-tight">
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Data
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'paid' | 'pending')}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
                    >
                      <option value="paid">Pago</option>
                      <option value="pending">Pendente</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Forma de Pagamento
                    </label>
                    <select
                      value={creditCardId ? `cc_${creditCardId}` : `w_${walletId || 'default'}`}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith('cc_')) {
                          setCreditCardId(val.replace('cc_', ''));
                          setWalletId(undefined);
                        } else {
                          setWalletId(val.replace('w_', ''));
                          setCreditCardId(undefined);
                        }
                      }}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
                    >
                      <optgroup label="Carteiras">
                        {wallets.map(w => (
                          <option key={`w_${w.id}`} value={`w_${w.id}`}>{w.name}</option>
                        ))}
                      </optgroup>
                      {creditCards.length > 0 && (
                        <optgroup label="Cartões de Crédito">
                          {creditCards.map(c => (
                            <option key={`cc_${c.id}`} value={`cc_${c.id}`}>{c.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>

                {type === "expense" && (
                  <div className="space-y-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isFixed"
                        checked={isFixed}
                        onChange={(e) => {
                          setIsFixed(e.target.checked);
                          if (e.target.checked) setIsRecurring(false);
                        }}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 dark:focus:ring-zinc-100 bg-white dark:bg-zinc-950"
                      />
                      <label htmlFor="isFixed" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                        Despesa Fixa Mensal
                      </label>
                    </div>
                    
                    <AnimatePresence>
                      {isFixed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2">
                            <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              Repetir por quantos meses? (Deixe 1 para apenas este mês)
                            </label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="1"
                                max="60"
                                value={installments}
                                onChange={(e) => setInstallments(Number(e.target.value))}
                                className="w-24"
                              />
                              <span className="text-xs text-zinc-400">meses</span>
                            </div>
                            <p className="mt-2 text-[10px] text-zinc-400 italic">
                              * Serão criadas cópias desta despesa para os próximos meses.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Nota (Opcional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Para que foi isso?"
                    value={note}
                    onChange={handleNoteChange}
                  />
                  {suggestedCategory && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryId(suggestedCategory);
                          setSuggestedCategory(null);
                        }}
                        className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <Sparkles className="h-3 w-3" />
                        Sugerido:{" "}
                        {
                          CATEGORIES.find((c) => c.id === suggestedCategory)
                            ?.name
                        }{" "}
                        - Clique para aplicar
                      </button>
                    </motion.div>
                  )}
                </div>

                {!transactionToEdit && type === "expense" && !isFixed && (
                  <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-zinc-100 dark:border-zinc-800">
                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRecurring}
                        onChange={(e) => {
                          setIsRecurring(e.target.checked);
                          if (e.target.checked) setIsFixed(false);
                        }}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 dark:focus:ring-zinc-100 bg-white dark:bg-zinc-950"
                      />
                      Compra Parcelada
                    </label>
                    
                    <AnimatePresence>
                      {isRecurring && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4">
                            <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              Em quantas vezes? (O valor total será dividido)
                            </label>
                            <Input
                              type="number"
                              min="2"
                              max="120"
                              value={installments}
                              onChange={(e) => setInstallments(Number(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-base">
                  {transactionToEdit
                    ? "Salvar Alterações"
                    : `Adicionar ${type === "expense" ? "Despesa" : "Receita"}`}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
