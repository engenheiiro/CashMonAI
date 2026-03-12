import React, { useState, useEffect } from "react";
import { useExpenses } from "../context/ExpenseContext";
import { Button } from "./ui/button";
import { Plus, Target, Calendar, TrendingUp, MoreVertical, Trash2, Edit2, ChevronRight, DollarSign, ShieldCheck, AlertCircle, Info, Wallet as WalletIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function GoalsPanel() {
  const { goals, addGoal, updateGoal, deleteGoal, addFundsToGoal, wallets, activeWalletId, balance, minimumBalance, setMinimumBalance } = useExpenses();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingFunds, setIsAddingFunds] = useState<string | null>(null);
  const [fundsAmount, setFundsAmount] = useState("");
  const [isEditingBuffer, setIsEditingBuffer] = useState(false);
  const [tempBuffer, setTempBuffer] = useState(minimumBalance.toString());
  const [selectedWalletId, setSelectedWalletId] = useState<string>(activeWalletId || wallets[0]?.id || "default");
  
  useEffect(() => {
    if (activeWalletId) {
      setSelectedWalletId(activeWalletId);
    }
  }, [activeWalletId]);

  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "0",
    color: "#3b82f6",
    deadline: ""
  });

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.targetAmount) return;

    addGoal({
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: parseFloat(newGoal.currentAmount),
      color: newGoal.color,
      deadline: newGoal.deadline || undefined
    });

    setNewGoal({
      name: "",
      targetAmount: "",
      currentAmount: "0",
      color: "#3b82f6",
      deadline: ""
    });
    setIsAddingGoal(false);
  };

  const handleAddFunds = (goalId: string) => {
    const amount = parseFloat(fundsAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    addFundsToGoal(goalId, amount, selectedWalletId);
    setFundsAmount("");
    setIsAddingFunds(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const availableToInvest = Math.max(0, balance - minimumBalance);

  const handleSaveBuffer = () => {
    const val = parseFloat(tempBuffer);
    if (!isNaN(val)) {
      setMinimumBalance(val);
      setIsEditingBuffer(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Minhas Metas</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Acompanhe seus objetivos financeiros</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditingBuffer(true)} className="gap-2 rounded-full border-zinc-200 dark:border-zinc-800">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Reserva de Segurança
          </Button>
          <Button onClick={() => setIsAddingGoal(true)} className="gap-2 rounded-full">
            <Plus className="h-4 w-4" />
            Nova Meta
          </Button>
        </div>
      </div>

      {/* Safety Buffer Settings */}
      <AnimatePresence>
        {isEditingBuffer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Reserva de Segurança</h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300/70 max-w-md">
                      Defina um valor mínimo que você deseja manter na conta. O sistema calculará quanto você pode investir sem comprometer sua segurança.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">R$</span>
                    <input
                      type="number"
                      value={tempBuffer}
                      onChange={(e) => setTempBuffer(e.target.value)}
                      className="bg-white dark:bg-zinc-900 border-none rounded-xl pl-9 pr-4 py-2 w-32 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-900 dark:text-emerald-100"
                    />
                  </div>
                  <Button onClick={handleSaveBuffer} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">Salvar</Button>
                  <Button variant="ghost" onClick={() => setIsEditingBuffer(false)} className="text-emerald-700 dark:text-emerald-400">Cancelar</Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Saldo Atual</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{formatCurrency(balance)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Reserva de Segurança</p>
          <p className="text-xl font-bold text-emerald-500">{formatCurrency(minimumBalance)}</p>
        </div>
        <div className={`p-4 rounded-2xl border shadow-sm transition-colors ${availableToInvest > 0 ? 'bg-zinc-900 text-white border-zinc-800' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800 text-zinc-400'}`}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Disponível para Investir</p>
            {availableToInvest > 0 && <TrendingUp className="h-3 w-3 text-emerald-400" />}
          </div>
          <p className="text-xl font-bold">{formatCurrency(availableToInvest)}</p>
        </div>
      </div>

      <AnimatePresence>
        {isAddingGoal && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800"
          >
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome da Meta</label>
                  <input
                    type="text"
                    required
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    placeholder="Ex: Viagem, Carro Novo..."
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Valor Alvo (R$)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                    placeholder="0,00"
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Valor Atual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newGoal.currentAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                    placeholder="0,00"
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Prazo (Opcional)</label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Cor</label>
                  <div className="flex gap-2">
                    {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewGoal({ ...newGoal, color: c })}
                        className={`w-8 h-8 rounded-full transition-transform ${newGoal.color === c ? "scale-125 ring-2 ring-offset-2 ring-zinc-400" : ""}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsAddingGoal(false)}>Cancelar</Button>
                <Button type="submit">Criar Meta</Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const percentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          
          return (
            <motion.div
              key={goal.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: goal.color }}
                  >
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{goal.name}</h3>
                    {goal.deadline && (
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(goal.deadline), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => deleteGoal(goal.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Progresso</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(goal.currentAmount)}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Alvo</p>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                </div>

                <div className="relative h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute top-0 left-0 h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                    style={{ backgroundColor: goal.color }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-zinc-500">{percentage.toFixed(1)}% concluído</span>
                  <span className="text-zinc-500">Faltam {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                {isAddingFunds === goal.id ? (
                  <div className="space-y-4">
                    {/* Guidance Info */}
                    <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${availableToInvest > 0 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-orange-500/10 text-orange-700 dark:text-orange-400'}`}>
                      {availableToInvest > 0 ? (
                        <>
                          <Info className="h-4 w-4 shrink-0" />
                          <p>Você tem <strong>{formatCurrency(availableToInvest)}</strong> disponíveis acima da sua reserva de segurança.</p>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <p>Seu saldo está abaixo da reserva de segurança. Pense bem antes de investir agora.</p>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">R$</span>
                        <input
                          type="number"
                          autoFocus
                          placeholder="0,00"
                          value={fundsAmount}
                          onChange={(e) => setFundsAmount(e.target.value)}
                          className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl pl-9 pr-3 py-2 text-sm outline-none font-bold"
                        />
                      </div>
                      <Button size="sm" onClick={() => handleAddFunds(goal.id)} className="rounded-xl px-6">Investir</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsAddingFunds(null)} className="rounded-xl">X</Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {availableToInvest > 0 && (
                        <button
                          onClick={() => setFundsAmount(availableToInvest.toString())}
                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors"
                        >
                          Usar Disponível
                        </button>
                      )}
                      <button
                        onClick={() => setFundsAmount((goal.targetAmount - goal.currentAmount).toString())}
                        className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        Completar Meta
                      </button>
                    </div>
                    
                    {wallets.length > 1 && (
                      <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <WalletIcon className="h-3 w-3" />
                          Retirar de:
                        </div>
                        <select
                          value={selectedWalletId}
                          onChange={(e) => setSelectedWalletId(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-xs outline-none"
                        >
                          {wallets.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 rounded-xl"
                    onClick={() => setIsAddingFunds(goal.id)}
                  >
                    <DollarSign className="h-4 w-4" />
                    Adicionar Fundos
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}

        {goals.length === 0 && !isAddingGoal && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
              <Target className="h-10 w-10 text-zinc-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Nenhuma meta criada</h3>
              <p className="text-zinc-500 dark:text-zinc-400">Comece a planejar seus sonhos hoje mesmo!</p>
            </div>
            <Button onClick={() => setIsAddingGoal(true)} className="rounded-full">
              Criar minha primeira meta
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
