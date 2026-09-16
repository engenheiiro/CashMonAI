import React, { useState, useMemo } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { format, parseISO, isWithinInterval, startOfMonth, addMonths, endOfMonth } from 'date-fns';
import { IconRenderer } from '../components/IconRenderer';

export function TransactionsView() {
  const { transactions, categories, deleteTransaction, updateTransaction } = useFinance();
  const [filter, setFilter] = useState('all');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState<string>(
    [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ][new Date().getMonth()]
  );

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => format(parseISO(t.date), 'yyyy')));
    return Array.from(years).sort().reverse();
  }, [transactions]);

  const sortedTx = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const filteredTx = sortedTx.filter(tx => {
    let pass = true;

    if (filter === 'income' && tx.type !== 'income') pass = false;
    if (filter === 'expense' && tx.type !== 'expense') pass = false;
    if (filter === 'pending' && tx.status !== 'pending') pass = false;

    const txDate = parseISO(tx.date);

    if (filterMonth === 'next3') {
       const start = startOfMonth(new Date());
       const end = endOfMonth(addMonths(start, 2));
       if (!isWithinInterval(txDate, { start, end })) pass = false;
    } else if (filterMonth === 'next6') {
       const start = startOfMonth(new Date());
       const end = endOfMonth(addMonths(start, 5));
       if (!isWithinInterval(txDate, { start, end })) pass = false;
    } else {
       const txYear = format(txDate, 'yyyy');
       const txMonth = format(txDate, 'MMMM').toLowerCase();

       if (filterYear !== 'all' && txYear !== filterYear) pass = false;
       if (filterMonth !== 'all' && txMonth !== filterMonth) pass = false;
    }

    return pass;
  });

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
          <p className="text-muted">Toda a sua atividade</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <select 
              className="minimal-input bg-white text-sm"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="all">Todos os Anos</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select 
              className="minimal-input bg-white text-sm capitalize"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="all">Todos os Meses</option>
              {['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="next3" className="font-semibold text-blue-600">Próximos 3 meses</option>
              <option value="next6" className="font-semibold text-blue-600">Próximos 6 meses</option>
            </select>
          </div>
          <select 
            className="minimal-input bg-white text-sm" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
            <option value="pending">Contas Pendentes</option>
          </select>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {filteredTx.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Nenhuma transação encontrada.</div>
        ) : (
          <div className="divide-y subtle-border">
            {filteredTx.map(tx => {
              const cat = categories.find(c => c.id === tx.category);
              return (
                <div key={tx.id} className={`flex justify-between items-center p-4 hover:bg-gray-50 transition-colors group ${tx.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => updateTransaction(tx.id, { status: tx.status === 'pending' ? 'paid' : 'pending' })}
                      className="text-gray-400 hover:text-[#1a1a1a] transition-colors"
                      title={tx.status === 'pending' ? 'Marcar como pago' : 'Marcar como pendente'}
                    >
                      {tx.status === 'pending' ? <Circle className="w-5 h-5 text-amber-500" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </button>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat?.color || '#ccc'}20` }}>
                      {cat?.icon ? (
                        <IconRenderer iconName={cat.icon} className="w-5 h-5" color={cat?.color || (tx.type === 'income' ? '#22c55e' : '#ef4444')} />
                      ) : (
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat?.color || (tx.type === 'income' ? '#22c55e' : '#ef4444') }} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {tx.description}
                        {tx.status === 'pending' && <span className="text-[10px] uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm">Pendente</span>}
                      </p>
                      <p className="text-xs text-gray-500">{cat?.name}{tx.subcategory && ` - ${tx.subcategory}`} • {formatDate(tx.date)} {tx.isRecurring && '• Recorrente'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`font-mono font-medium ${tx.type === 'income' ? 'text-green-600' : ''}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteTransaction(tx.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
