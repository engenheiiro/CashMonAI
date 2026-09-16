import React, { useMemo, useState } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency, parseAmount } from '../lib/utils';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../components/ui/button';

export function BudgetsView() {
  const { budgets, transactions, categories, addBudget, updateBudget } = useFinance();
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  
  const [isAdding, setIsAdding] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [newSubcat, setNewSubcat] = useState('');
  const [newAmt, setNewAmt] = useState('');

  const currentMonthBudgets = budgets.filter(b => b.month === currentMonthStr);

  const budgetProgress = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const thisMonthTx = transactions.filter(t => 
      isWithinInterval(parseISO(t.date), { start, end }) && t.type === 'expense'
    );

    return currentMonthBudgets.map(b => {
      const cat = categories.find(c => c.id === b.categoryId);
      // Filter by category and optionally subcategory
      const spent = thisMonthTx.filter(t => t.category === b.categoryId && (!b.subcategory || t.subcategory === b.subcategory)).reduce((acc, curr) => acc + curr.amount, 0);
      const remaining = b.plannedAmount - spent;
      const progress = Math.min((spent / b.plannedAmount) * 100, 100);
      
      const displayName = b.subcategory ? `${cat?.name || 'Unknown'} - ${b.subcategory}` : cat?.name || 'Unknown';

      return {
        ...b,
        catName: displayName,
        catColor: cat?.color || '#ccc',
        spent,
        remaining,
        progress
      };
    });
  }, [currentMonthBudgets, transactions, categories]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseAmount(newAmt);
    if (!newCat || !parsedAmount || parsedAmount <= 0) return;

    // Check if already exists for this cat + subcat
    const existing = currentMonthBudgets.find(b => b.categoryId === newCat && b.subcategory === (newSubcat || undefined));
    if (existing) {
      updateBudget(existing.id, { plannedAmount: parsedAmount });
    } else {
      addBudget({
        categoryId: newCat,
        subcategory: newSubcat || undefined,
        plannedAmount: parsedAmount,
        month: currentMonthStr,
      });
    }
    setNewCat('');
    setNewSubcat('');
    setNewAmt('');
    setIsAdding(false);
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const selectedCategoryObj = categories.find(c => c.id === newCat);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orçamentos</h1>
          <p className="text-muted">Planejado vs Realizado de {format(new Date(), 'MMMM yyyy', { locale: ptBR })}</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancelar' : 'Definir Orçamento'}
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="glass-card p-4 flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 w-full space-y-1">
            <label className="text-sm font-medium">Categoria</label>
            <select className="minimal-input w-full bg-white" value={newCat} onChange={e => { setNewCat(e.target.value); setNewSubcat(''); }} required>
              <option value="" disabled>Selecionar categoria</option>
              {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {selectedCategoryObj?.subcategories && selectedCategoryObj.subcategories.length > 0 && (
             <div className="flex-1 w-full space-y-1">
               <label className="text-sm font-medium">Subcategoria (Opcional)</label>
               <select className="minimal-input w-full bg-white text-sm" value={newSubcat} onChange={e => setNewSubcat(e.target.value)}>
                 <option value="">Geral...</option>
                 {selectedCategoryObj.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
             </div>
          )}
          <div className="flex-1 w-full space-y-1">
            <label className="text-sm font-medium">Valor Planejado</label>
            <input type="number" step="0.01" min="0.01" className="minimal-input w-full" value={newAmt} onChange={e => setNewAmt(e.target.value)} required placeholder="0.00"/>
          </div>
          <Button type="submit" className="w-full md:w-auto">Salvar</Button>
        </form>
      )}

      <div className="grid gap-4">
        {budgetProgress.length === 0 && !isAdding && (
          <div className="text-center p-12 glass-card text-gray-500">
            Nenhum orçamento definido para este mês.
          </div>
        )}
        {budgetProgress.map(b => (
          <div key={b.id} className="glass-card p-5">
            <div className="flex justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.catColor }} />
                <span className="font-medium">{b.catName}</span>
              </div>
              <div className="text-sm">
                <span className="font-mono">{formatCurrency(b.spent)}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="font-mono text-gray-500">{formatCurrency(b.plannedAmount)}</span>
              </div>
            </div>
            
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full transition-all ${b.progress > 90 ? 'bg-red-500' : 'bg-green-500'}`} 
                style={{ width: `${b.progress}%`, backgroundColor: b.progress > 90 ? '#ef4444' : b.catColor }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>{b.progress.toFixed(0)}% usado</span>
              <span className={b.remaining < 0 ? 'text-red-500 font-medium' : ''}>
                {b.remaining < 0 ? `${formatCurrency(Math.abs(b.remaining))} excedido` : `${formatCurrency(b.remaining)} restante`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
