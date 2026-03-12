import React, { useState } from "react";
import { useExpenses } from "../context/ExpenseContext";
import { CreditCard as CreditCardIcon, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion } from "motion/react";

export const CreditCardsPanel = () => {
  const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard } = useExpenses();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const handleAdd = () => {
    if (!name || !limit || !closingDay || !dueDay) return;
    addCreditCard({
      name,
      limit: Number(limit),
      closingDay: Number(closingDay),
      dueDay: Number(dueDay),
      color,
    });
    setIsAdding(false);
    resetForm();
  };

  const handleUpdate = (id: string) => {
    if (!name || !limit || !closingDay || !dueDay) return;
    updateCreditCard(id, {
      name,
      limit: Number(limit),
      closingDay: Number(closingDay),
      dueDay: Number(dueDay),
      color,
    });
    setEditingId(null);
    resetForm();
  };

  const startEditing = (card: any) => {
    setEditingId(card.id);
    setName(card.name);
    setLimit(card.limit.toString());
    setClosingDay(card.closingDay.toString());
    setDueDay(card.dueDay.toString());
    setColor(card.color);
  };

  const resetForm = () => {
    setName("");
    setLimit("");
    setClosingDay("");
    setDueDay("");
    setColor("#3b82f6");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <CreditCardIcon className="h-6 w-6 text-emerald-500" />
          Cartões de Crédito
        </h2>
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Cartão
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {creditCards.map((card) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: card.color }} />
            
            {editingId === card.id ? (
              <div className="space-y-4 mt-2">
                <Input
                  placeholder="Nome do Cartão"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Limite"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Fechamento (Dia)"
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Vencimento (Dia)"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer"
                  />
                  <span className="text-xs text-zinc-500">Cor do Cartão</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleUpdate(card.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">{card.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => startEditing(card)} className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteCreditCard(card.id)} className="p-1 text-zinc-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Limite Total</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">R$ {formatCurrency(card.limit)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Fechamento</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">Dia {card.closingDay}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Vencimento</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">Dia {card.dueDay}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {isAdding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm"
          >
            <div className="space-y-4">
              <Input
                placeholder="Nome do Cartão (ex: Nubank)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Limite (R$)"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Fechamento (Dia)"
                  value={closingDay}
                  onChange={(e) => setClosingDay(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Vencimento (Dia)"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer"
                />
                <span className="text-xs text-zinc-500">Cor do Cartão</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
