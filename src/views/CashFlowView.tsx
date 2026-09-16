import React, { useMemo, useState } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Transaction } from '../types';

export function CashFlowView() {
  const { transactions, categories } = useFinance();
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState<string>(
    [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ][new Date().getMonth()]
  );
  
  const [sortColumn, setSortColumn] = useState<'date' | 'priority' | 'category' | 'description' | 'income' | 'expense' | 'balance'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getPriorityInfo = (type: string, categoryId: string) => {
    if (type === 'income') {
       return { priority: 1, bg: 'bg-blue-200 text-blue-900', text: 'Renda' };
    }
    if (categoryId === 'cat_debts') {
       return { priority: 3, bg: 'bg-orange-200 text-orange-900', text: 'Dívidas' };
    }
    if (categoryId === 'cat_investment') {
       return { priority: 4, bg: 'bg-green-500 text-white', text: 'Investimentos' };
    }
    return { priority: 2, bg: 'bg-red-200 text-red-900', text: 'Despesas' };
  };

  const tableData = useMemo(() => {
    // Sort transactions chronological (oldest first) to calculate running balance
    // 1. By Date ASC
    // 2. By Priority ASC
    const mappedWithPriority = transactions
      .map(t => ({
          ...t,
          ...getPriorityInfo(t.type, t.category)
      }));

    const chronoSorted = mappedWithPriority.sort((a, b) => {
      const dateA = new Date(a.date);
      dateA.setHours(0, 0, 0, 0); // normalize time for daily order
      const dateB = new Date(b.date);
      dateB.setHours(0, 0, 0, 0); // normalize time for daily order
      
      const dateDiff = dateA.getTime() - dateB.getTime();
      if (dateDiff !== 0) return dateDiff;
      
      return a.priority - b.priority;
    });

    let currentBalance = 0;
    
    const rows = chronoSorted.map((tx, index) => {
      const isIncome = tx.type === 'income';
      const isExpense = tx.type === 'expense';
      
      if (isIncome) {
        currentBalance += tx.amount;
      } else {
        currentBalance -= tx.amount;
      }

      const txDate = parseISO(tx.date);
      const year = format(txDate, 'yyyy');
      const month = format(txDate, 'MMMM', { locale: ptBR });
      const formattedDate = format(txDate, 'dd/MM/yyyy');

      return {
        id: tx.id || String(index),
        index: index + 1,
        year,
        month,
        date: formattedDate,
        rawDate: txDate,
        categoryName: tx.text,
        themeClass: tx.bg,
        priority: tx.priority,
        description: tx.description,
        status: tx.status,
        income: isIncome ? tx.amount : null,
        expense: isExpense ? tx.amount : null,
        balance: currentBalance,
        observations: tx.subcategory || ''
      };
    });

    // Keep only the selected month
    let filtered = rows;
    
    if (filterYear !== 'all') {
      filtered = filtered.filter(r => r.year === filterYear);
    }
    if (filterMonth !== 'all') {
      filtered = filtered.filter(r => r.month === filterMonth);
    }
    
    // Sort based on user selection
    const displayRows = [...filtered].sort((a, b) => {
      const modifier = sortDirection === 'desc' ? -1 : 1;
      
      switch (sortColumn) {
         case 'date': {
            const dDiff = a.rawDate.getTime() - b.rawDate.getTime();
            if (dDiff !== 0) return dDiff * modifier;
            return (a.priority - b.priority) * modifier;
         }
         case 'priority': return (a.priority - b.priority) * modifier;
         case 'category': return a.categoryName.localeCompare(b.categoryName) * modifier;
         case 'description': return a.description.localeCompare(b.description) * modifier;
         case 'income': return ((a.income || 0) - (b.income || 0)) * modifier;
         case 'expense': return ((a.expense || 0) - (b.expense || 0)) * modifier;
         case 'balance': return (a.balance - b.balance) * modifier;
         default: return 0;
      }
    });

    return displayRows;
  }, [transactions, filterYear, filterMonth, sortColumn, sortDirection]);

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => format(parseISO(t.date), 'yyyy')));
    return Array.from(years).sort().reverse();
  }, [transactions]);
  
  const availableMonths = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  const handleSort = (col: typeof sortColumn) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (col: typeof sortColumn) => {
    if (sortColumn !== col) return <span className="opacity-0 group-hover:opacity-50 ml-1">↕</span>;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-6 pb-24 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fluxo de Caixa</h1>
          <p className="text-muted">Visão detalhada de entradas e saídas</p>
        </div>
        
        <div className="flex gap-2">
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
              {availableMonths.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
           </select>
        </div>
      </div>

      <div className="glass-card flex-1 overflow-visible flex flex-col">
        <div className="flex-1 w-full">
          <table className="w-full text-sm text-left border-collapse table-fixed">
            <thead className="text-xs text-white uppercase bg-emerald-800 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-3 py-3 border border-emerald-700 w-24 cursor-pointer hover:bg-emerald-700 select-none group" onClick={() => handleSort('date')}>Data {renderSortIcon('date')}</th>
                <th className="px-1 py-3 border border-emerald-700 w-12 text-center cursor-pointer hover:bg-emerald-700 select-none group" onClick={() => handleSort('priority')}># {renderSortIcon('priority')}</th>
                <th className="px-3 py-3 border border-emerald-700 w-32 hidden sm:table-cell cursor-pointer hover:bg-emerald-700 select-none group" onClick={() => handleSort('category')}>Categoria {renderSortIcon('category')}</th>
                <th className="px-3 py-3 border border-emerald-700 truncate cursor-pointer hover:bg-emerald-700 select-none group" onClick={() => handleSort('description')}>Descrição {renderSortIcon('description')}</th>
                <th className="px-3 py-3 border border-emerald-700 w-28 text-right cursor-pointer hover:bg-emerald-700 select-none group" onClick={() => handleSort('income')}>Entrada {renderSortIcon('income')}</th>
                <th className="px-3 py-3 border border-emerald-700 w-28 text-right cursor-pointer hover:bg-emerald-700 select-none group" onClick={() => handleSort('expense')}>Saída {renderSortIcon('expense')}</th>
                <th className="px-3 py-3 border border-emerald-700 w-32 text-right hidden sm:table-cell cursor-pointer hover:bg-emerald-700 select-none group" onClick={() => handleSort('balance')}>Saldo {renderSortIcon('balance')}</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Nenhum registro encontrado para este período.
                  </td>
                </tr>
              ) : (
                tableData.map((row, i) => (
                  <tr key={row.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="px-3 py-2 border-r border-gray-200">{row.date}</td>
                    <td className="px-1 py-2 border-r border-gray-200 text-center text-gray-400 bg-gray-50 text-xs font-mono">{row.priority}</td>
                    <td className="px-3 py-2 border-r border-gray-200 hidden sm:table-cell">
                       <span className={`px-2 py-0.5 flex items-center justify-center font-medium text-xs rounded-full ${row.themeClass}`}>
                         {row.categoryName}
                       </span>
                    </td>
                    <td className="px-3 py-2 border-r border-gray-200 truncate" title={`${row.description}${row.observations ? ` - ${row.observations}` : ''}`}>
                      <div className="flex flex-col">
                         <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 truncate">{row.description}</span>
                            {row.status === 'pending' && <span className="text-[9px] uppercase tracking-wider bg-amber-100 text-amber-800 px-1 py-0.5 rounded-sm shrink-0">Pendente</span>}
                         </div>
                         {row.observations && (
                            <span className="text-xs text-gray-500 truncate">{row.observations}</span>
                         )}
                      </div>
                    </td>
                    <td className="px-3 py-2 border-r border-gray-200 text-right bg-blue-50/30 text-blue-700 font-medium whitespace-nowrap">
                      {row.income ? formatCurrency(row.income) : '-'}
                    </td>
                    <td className="px-3 py-2 border-r border-gray-200 text-right bg-orange-50/30 text-red-600 font-medium whitespace-nowrap">
                      {row.expense ? formatCurrency(row.expense) : '-'}
                    </td>
                    <td className="px-3 py-2 border-r border-gray-200 text-right bg-green-50/50 font-medium text-green-800 whitespace-nowrap hidden sm:table-cell">
                      {formatCurrency(row.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
