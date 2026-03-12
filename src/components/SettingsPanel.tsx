import React, { useState } from "react";
import { useExpenses } from "../context/ExpenseContext";
import { Wallet, Edit2, Trash2, Check, X as XIcon, Plus, AlertTriangle, Tag, Target } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

export function SettingsPanel() {
  const { 
    wallets, activeWalletId, setActiveWalletId, addWallet, updateWallet, deleteWallet,
    categories, addCategory, updateCategory, deleteCategory,
    goals, addGoal, updateGoal, deleteGoal, addFundsToGoal,
    resetAllData
  } = useExpenses();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Wallet States
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [editWalletName, setEditWalletName] = useState("");
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);

  // Category States
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");

  return (
    <div className="space-y-12">
      {/* Wallets Section */}
      <section>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <Wallet className="h-5 w-5 text-emerald-500" />
          Minhas Carteiras
        </h3>
        <div className="space-y-3">
          {wallets.map(wallet => (
            <div key={wallet.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              {editingWalletId === wallet.id ? (
                <div className="flex items-center gap-2 flex-1 mr-4">
                  <Input 
                    value={editWalletName} 
                    onChange={(e) => setEditWalletName(e.target.value)}
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editWalletName.trim()) {
                        updateWallet(wallet.id, editWalletName.trim());
                        setEditingWalletId(null);
                      }
                    }}
                  />
                  <Button size="sm" onClick={() => { 
                    if(editWalletName.trim()) {
                      updateWallet(wallet.id, editWalletName.trim()); 
                      setEditingWalletId(null); 
                    }
                  }} className="h-8 px-2 bg-emerald-500 hover:bg-emerald-600"><Check className="h-4 w-4 text-white"/></Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingWalletId(null)} className="h-8 px-2"><XIcon className="h-4 w-4"/></Button>
                </div>
              ) : (
                <>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{wallet.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingWalletId(wallet.id); setEditWalletName(wallet.name); }} className="p-2 text-zinc-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"><Edit2 className="h-4 w-4"/></button>
                    {wallets.length > 1 && (
                      <button onClick={() => setWalletToDelete(wallet.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4"/></button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
          
          {isAddingWallet ? (
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <Input 
                placeholder="Nome da nova carteira..."
                value={newWalletName} 
                onChange={(e) => setNewWalletName(e.target.value)}
                className="h-8"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newWalletName.trim()) {
                    addWallet(newWalletName.trim());
                    setIsAddingWallet(false);
                    setNewWalletName("");
                  }
                }}
              />
              <Button size="sm" onClick={() => { 
                if(newWalletName.trim()) { 
                  addWallet(newWalletName.trim()); 
                  setIsAddingWallet(false); 
                  setNewWalletName(""); 
                } 
              }} className="h-8 px-2 bg-emerald-500 hover:bg-emerald-600"><Check className="h-4 w-4 text-white"/></Button>
              <Button size="sm" variant="ghost" onClick={() => { setIsAddingWallet(false); setNewWalletName(""); }} className="h-8 px-2"><XIcon className="h-4 w-4"/></Button>
            </div>
          ) : (
            <Button onClick={() => setIsAddingWallet(true)} variant="outline" className="w-full border-dashed border-2 h-12 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
              <Plus className="w-4 h-4 mr-2"/> Nova Carteira
            </Button>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <Tag className="h-5 w-5 text-blue-500" />
          Categorias Personalizadas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map(category => (
            <div key={category.id} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              {editingCategoryId === category.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input 
                    value={editCategoryName} 
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className="h-8 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editCategoryName.trim()) {
                        updateCategory(category.id, { ...category, name: editCategoryName.trim() });
                        setEditingCategoryId(null);
                      }
                    }}
                  />
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => { 
                      if(editCategoryName.trim()) {
                        updateCategory(category.id, { ...category, name: editCategoryName.trim() }); 
                        setEditingCategoryId(null); 
                      }
                    }} className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600"><Check className="h-4 w-4 text-white"/></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingCategoryId(null)} className="h-8 w-8 p-0"><XIcon className="h-4 w-4"/></Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-50 truncate">{category.name}</span>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <button onClick={() => { setEditingCategoryId(category.id); setEditCategoryName(category.name); }} className="p-1.5 text-zinc-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"><Edit2 className="h-3.5 w-3.5"/></button>
                    <button onClick={() => {
                        if (confirm(`Excluir categoria "${category.name}"?`)) {
                          deleteCategory(category.id);
                          toast.success("Categoria excluída.");
                        }
                    }} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5"/></button>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {isAddingCategory ? (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 sm:col-span-2">
              <input type="color" value={newCategoryColor} onChange={(e) => setNewCategoryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
              <Input 
                placeholder="Nome da categoria..."
                value={newCategoryName} 
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-8 flex-1 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCategoryName.trim()) {
                    addCategory({ name: newCategoryName.trim(), color: newCategoryColor, icon: "Tag" });
                    setIsAddingCategory(false);
                    setNewCategoryName("");
                  }
                }}
              />
              <div className="flex gap-1">
                <Button size="sm" onClick={() => { 
                  if(newCategoryName.trim()) { 
                    addCategory({ name: newCategoryName.trim(), color: newCategoryColor, icon: "Tag" }); 
                    setIsAddingCategory(false); 
                    setNewCategoryName(""); 
                  } 
                }} className="h-8 px-3 bg-blue-500 hover:bg-blue-600"><Check className="h-4 w-4 text-white"/></Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsAddingCategory(false); setNewCategoryName(""); }} className="h-8 px-2"><XIcon className="h-4 w-4"/></Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsAddingCategory(true)} variant="outline" className="sm:col-span-2 border-dashed border-2 h-10 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
              <Plus className="w-3.5 h-3.5 mr-2"/> Nova Categoria
            </Button>
          )}
        </div>
      </section>

      {/* Goals Section */}
      <section>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <Target className="h-5 w-5 text-purple-500" />
          Metas de Economia
        </h3>
        <div className="space-y-3">
          {goals.map(goal => (
            <div key={goal.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <div className="flex-1 mr-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: goal.color }} />
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{goal.name}</span>
                  </div>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(goal.currentAmount)} / {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(goal.targetAmount)}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%`,
                      backgroundColor: goal.color
                    }} 
                  />
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => {
                  const amount = prompt("Quanto deseja adicionar à meta?");
                  if (amount && !isNaN(Number(amount))) {
                    addFundsToGoal(goal.id, Number(amount));
                    toast.success("Fundos adicionados à meta.");
                  }
                }} className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10"><Plus className="h-4 w-4"/></button>
                <button onClick={() => {
                    deleteGoal(goal.id);
                    toast.success("Meta excluída.");
                }} className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4"/></button>
              </div>
            </div>
          ))}
          
          <Button onClick={() => {
            const name = prompt("Nome da meta:");
            if (!name) return;
            const target = prompt("Valor alvo:");
            if (!target || isNaN(Number(target))) return;
            
            addGoal({
              name,
              targetAmount: Number(target),
              currentAmount: 0,
              color: "#a855f7", // default purple
              deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
            });
            toast.success("Meta criada com sucesso.");
          }} variant="outline" className="w-full border-dashed border-2 h-12 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
            <Plus className="w-4 h-4 mr-2"/> Nova Meta
          </Button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          Zona de Perigo
        </h3>
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-red-900 dark:text-red-100">Resetar Conta</h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                Apaga permanentemente todos os seus dados (transações, carteiras, metas, etc). Esta ação não pode ser desfeita.
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => setShowResetConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white shrink-0"
            >
              Resetar Tudo
            </Button>
          </div>
        </div>
      </section>

      {/* Delete Wallet Confirmation Modal */}
      <AnimatePresence>
        {walletToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWalletToDelete(null)}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
            >
              <div className="rounded-3xl bg-white dark:bg-zinc-950 p-6 shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Excluir Carteira
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setWalletToDelete(null)}
                    className="h-8 w-8 rounded-full"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                  Tem certeza que deseja excluir esta carteira? <strong>Todas as transações associadas a ela também serão apagadas.</strong> Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setWalletToDelete(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      deleteWallet(walletToDelete);
                      setWalletToDelete(null);
                      toast.success("Carteira excluída com sucesso.");
                    }}
                  >
                    Sim, excluir
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reset Account Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
            >
              <div className="rounded-3xl bg-white dark:bg-zinc-950 p-6 shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Resetar Todos os Dados
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowResetConfirm(false)}
                    className="h-8 w-8 rounded-full"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                  Você está prestes a apagar <strong>absolutamente tudo</strong>. Suas transações, carteiras, cartões de crédito e metas serão removidos permanentemente.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      resetAllData();
                    }}
                  >
                    Sim, resetar tudo
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
