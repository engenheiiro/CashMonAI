import React, { useState, useMemo } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency, parseAmount } from '../lib/utils';
import { Button } from '../components/ui/button';
import { format, parseISO, isSameMonth } from 'date-fns';
import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function InvestmentsView() {
  const { investments, recurringBills, addInvestment, updateInvestment, deleteInvestment, transactions, addTransaction } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Reserva de Emergência');
  const [amount, setAmount] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  interface TransactionModalState {
    isOpen: boolean;
    invId: string | null;
    type: 'deposit' | 'withdraw';
    amount: string;
    date: string;
  }
  
  const [txModal, setTxModal] = useState<TransactionModalState>({
    isOpen: false,
    invId: null,
    type: 'deposit',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

  // Balances
  const totalBalance = useMemo(() => {
    return transactions.filter(t => t.status === 'paid').reduce((acc, curr) => 
      curr.type === 'income' ? acc + curr.amount : acc - curr.amount
    , 0);
  }, [transactions]);

  const monthBalance = useMemo(() => {
     const now = new Date();
     const currentMonthTx = transactions.filter(t => isSameMonth(parseISO(t.date), now));
     const incomes = currentMonthTx.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
     const expenses = currentMonthTx.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
     return incomes - expenses; // Includes pendings
  }, [transactions]);

  const annualBalance = useMemo(() => {
     const recurringIncome = recurringBills.filter(b => b.status === 'active' && b.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
     const recurringExpense = recurringBills.filter(b => b.status === 'active' && b.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
     return totalBalance + (recurringIncome - recurringExpense) * 12;
  }, [totalBalance, recurringBills]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseAmount(amount);
    const parsedGoal = goalAmount ? parseAmount(goalAmount) : undefined;
    if (!name || !parsedAmount || parsedAmount <= 0 || !date) return;
    if (goalAmount && (parsedGoal === null || parsedGoal <= 0)) return;

    addInvestment({
      name,
      type,
      amount: parsedAmount,
      goalAmount: parsedGoal ?? undefined,
      withdrawnAmount: 0,
      date: new Date(date + 'T12:00:00').toISOString()
    });

    // Add transaction for initial deposit
    addTransaction({
       amount: parsedAmount,
       category: 'cat_investment',
       date: new Date(date + 'T12:00:00').toISOString(),
       description: `Aporte: ${name}`,
       status: 'paid',
       type: 'expense'
    });
    
    setName('');
    setAmount('');
    setGoalAmount('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setIsAdding(false);
  };

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txModal.invId || !txModal.amount || !txModal.date) return;
    
    const inv = investments.find(i => i.id === txModal.invId);
    if (!inv) return;
    
    const val = parseFloat(txModal.amount);
    if (isNaN(val) || val <= 0) return;
    
    if (txModal.type === 'withdraw' && val > inv.amount) {
        alert('Valor de retirada não pode ser maior que o guardado.');
        return;
    }
    
    const isDeposit = txModal.type === 'deposit';
    
    // Update investment amount
    updateInvestment(inv.id, { 
       amount: isDeposit ? inv.amount + val : inv.amount - val,
       withdrawnAmount: isDeposit ? (inv.withdrawnAmount || 0) : (inv.withdrawnAmount || 0) + val
    });

    // Add transaction to update general available balance
    addTransaction({
       amount: val,
       category: isDeposit ? 'cat_investment' : 'cat_income_other', // ou cat_investment mesmo, mas como type='income', user prefere 'outras receitas' ou 'rendimentos' 
       date: new Date(txModal.date + 'T12:00:00').toISOString(),
       description: `${isDeposit ? 'Aporte' : 'Resgate'}: ${inv.name}`,
       status: 'paid',
       type: isDeposit ? 'expense' : 'income'
    });
    
    setTxModal({ ...txModal, isOpen: false, amount: '', invId: null });
  };

  const investmentTypes = ['Reserva de Emergência', 'Viagem', 'Casa', 'Veículo', 'Compras', 'Aposentadoria', 'Outros'];

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Investimentos</h1>
          <p className="text-muted">Guarde dinheiro para seus objetivos</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? 'outline' : 'default'}>
          {isAdding ? 'Cancelar' : 'Nova Caixinha / Investimento'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 md:col-span-3 lg:col-span-1 flex flex-col justify-center items-center text-center">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Guardado</h2>
            <div className="text-4xl font-semibold text-[#14b8a6] font-mono tracking-tight">
                {formatCurrency(totalInvested)}
            </div>
        </div>
        
        <div className="glass-card p-6 md:col-span-3 lg:col-span-2">
            <h2 className="text-lg font-medium mb-4">Distribuicão por Categoria</h2>
            <div className="space-y-3">
                {investmentTypes.map(t => {
                    const typeTotal = investments.filter(i => i.type === t).reduce((sum, i) => sum + i.amount, 0);
                    if (typeTotal === 0) return null;
                    const pct = totalInvested > 0 ? (typeTotal / totalInvested) * 100 : 0;
                    return (
                        <div key={t} className="flex items-center gap-4">
                            <div className="w-32 text-sm font-medium truncate">{t}</div>
                            <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                            <div className="w-24 text-right font-mono text-sm">{formatCurrency(typeTotal)}</div>
                        </div>
                    )
                })}
                {totalInvested === 0 && <p className="text-sm text-gray-500 italic">Nenhum investimento registrado ainda.</p>}
            </div>
        </div>
      </div>

        {isAdding && (
          <form onSubmit={handleAdd} className="glass-card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#f8fafc] p-4 rounded-xl border border-slate-200">
             <div>
                <p className="text-sm text-slate-500 mb-1">Caixa Geral Inicial</p>
                <div className="font-mono font-medium text-lg text-slate-900">{formatCurrency(totalBalance)}</div>
                {amount && !isNaN(parseFloat(amount)) && (
                    <p className="text-xs text-orange-600 mt-1">
                      Após aporte: {formatCurrency(totalBalance - parseFloat(amount))}
                    </p>
                )}
             </div>
             <div>
                <p className="text-sm text-slate-500 mb-1">Caixa do Mês</p>
                <div className="font-mono font-medium text-lg text-slate-900">{formatCurrency(monthBalance)}</div>
                {amount && !isNaN(parseFloat(amount)) && (
                    <p className="text-xs text-orange-600 mt-1">
                      Após aporte: {formatCurrency(monthBalance - parseFloat(amount))}
                    </p>
                )}
             </div>
             <div>
                <p className="text-sm text-slate-500 mb-1" title="Saldo Geral em 12 meses">Projeção 12 Meses (Anual)</p>
                <div className="font-mono font-medium text-lg text-slate-900">{formatCurrency(annualBalance)}</div>
                {amount && !isNaN(parseFloat(amount)) && (
                    <p className="text-xs text-orange-600 mt-1">
                      Após aporte: {formatCurrency(annualBalance - parseFloat(amount))}
                    </p>
                )}
             </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
            <div>
                <label className="text-sm font-medium">Motivo / Nome (ex: Viagem Paris)</label>
                <input type="text" className="minimal-input w-full" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
                <label className="text-sm font-medium">Categoria</label>
                <select className="minimal-input w-full bg-white" value={type} onChange={e => setType(e.target.value)}>
                    {investmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div>
                <label className="text-sm font-medium" title="Quanto você quer atingir?">Meta Financeira (Opcional)</label>
                <input type="number" step="0.01" className="minimal-input w-full" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} />
            </div>
            <div>
                <label className="text-sm font-medium" title="Valor a aportar hoje">Aporte Inicial (R$)</label>
                <input type="number" step="0.01" className="minimal-input w-full" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <div className="lg:col-span-2 flex items-end justify-end">
                <Button type="submit" className="w-full sm:w-auto">Criar Caixinha</Button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {investments.length === 0 && !isAdding ? (
            <div className="p-12 md:col-span-2 lg:col-span-3 text-center text-gray-500 glass-card">
                Nenhuma caixinha criada ainda. Comece a guardar dinheiro para seus objetivos!
            </div>
        ) : (
            investments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(inv => {
               const progress = inv.goalAmount ? Math.min((inv.amount / inv.goalAmount) * 100, 100) : null;
               
               return (
                <div key={inv.id} className="glass-card p-5 group relative">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                         <button 
                             onClick={() => setTxModal({ ...txModal, isOpen: true, invId: inv.id, type: 'deposit', amount: '', date: format(new Date(), 'yyyy-MM-dd') })}
                             className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-2 py-1 rounded font-medium flex items-center gap-1"
                             title="Aportar (Adicionar Dinheiro)"
                         >
                            <ArrowDownRight className="w-3 h-3" /> Aportar
                         </button>
                         <button 
                             onClick={() => setTxModal({ ...txModal, isOpen: true, invId: inv.id, type: 'withdraw', amount: '', date: format(new Date(), 'yyyy-MM-dd') })}
                             className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded font-medium flex items-center gap-1 mr-2"
                             title="Retirar Dinheiro"
                         >
                            <ArrowUpRight className="w-3 h-3" /> Retirar
                         </button>
                         <button 
                             onClick={() => deleteInvestment(inv.id)}
                             className="text-gray-400 hover:text-red-600 font-bold p-1 rounded-full hover:bg-gray-100 transition-colors"
                             title="Deletar Caixinha"
                         >
                             <X className="w-4 h-4" />
                         </button>
                    </div>

                    <div className="mb-4">
                        <h3 className="font-semibold text-lg">{inv.name}</h3>
                        <p className="text-sm text-gray-500">{inv.type}</p>
                    </div>
                    
                    <div className="flex justify-between items-end mb-2">
                        <div>
                           <p className="text-xs text-gray-400 tracking-wider uppercase mb-1">Guardado</p>
                           <div className="font-mono text-xl text-[#14b8a6] font-semibold">{formatCurrency(inv.amount)}</div>
                        </div>
                        {inv.goalAmount && (
                            <div className="text-right">
                                <p className="text-xs text-gray-400 tracking-wider uppercase mb-1">Meta</p>
                                <div className="font-mono text-sm">{formatCurrency(inv.goalAmount)}</div>
                            </div>
                        )}
                    </div>
                    
                    {inv.goalAmount && progress !== null && (
                         <div className="mt-4">
                             <div className="flex justify-between text-xs text-gray-500 mb-1">
                                 <span>{progress.toFixed(1)}% atingido</span>
                             </div>
                             <div className="w-full bg-gray-100 rounded-full h-2">
                                 <div className="bg-[#14b8a6] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                             </div>
                         </div>
                    )}
                </div>
            )})
        )}
      </div>

      {txModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-[100] animate-in fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl scale-in-center">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">
                       {txModal.type === 'deposit' ? 'Aportar Dinheiro' : 'Resgatar Dinheiro'}
                    </h2>
                    <button type="button" onClick={() => setTxModal({ ...txModal, isOpen: false })} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                
                <form onSubmit={handleTxSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Data</label>
                        <input 
                            type="date" 
                            className="minimal-input w-full mt-1" 
                            value={txModal.date} 
                            onChange={e => setTxModal(m => ({ ...m, date: e.target.value }))} 
                            required 
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Valor (R$)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            min="0.01"
                            className="minimal-input w-full mt-1" 
                            value={txModal.amount} 
                            onChange={e => setTxModal(m => ({ ...m, amount: e.target.value }))} 
                            required 
                        />
                        {txModal.type === 'withdraw' && txModal.invId && (
                            <p className="text-xs text-slate-500 mt-2">
                               Total na caixinha: {formatCurrency(investments.find(i => i.id === txModal.invId)?.amount || 0)}
                            </p>
                        )}
                    </div>
                    
                    <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 text-sm">
                        <Button type="button" variant="outline" onClick={() => setTxModal({ ...txModal, isOpen: false })}>Cancelar</Button>
                        <Button 
                           type="submit"
                           className={txModal.type === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0' : 'bg-rose-600 hover:bg-rose-700 text-white border-0'}
                        >
                            {txModal.type === 'deposit' ? 'Aportar' : 'Resgatar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
