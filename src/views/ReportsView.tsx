import React, { useState, useMemo } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { parseISO, format, isWithinInterval, startOfYear, endOfYear, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { IconRenderer } from '../components/IconRenderer';

export function ReportsView() {
  const { transactions, categories } = useFinance();
  const [reportYear, setReportYear] = useState<string>(new Date().getFullYear().toString());

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => format(parseISO(t.date), 'yyyy')));
    const currentYear = new Date().getFullYear().toString();
    years.add(currentYear);
    return Array.from(years).sort().reverse();
  }, [transactions]);

  const reportData = useMemo(() => {
    const start = startOfYear(new Date(parseInt(reportYear), 0, 1));
    const end = endOfYear(new Date(parseInt(reportYear), 0, 1));

    const yearTx = transactions.filter(t => 
      t.status === 'paid' && isWithinInterval(parseISO(t.date), { start, end })
    );

    const totalIncome = yearTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = yearTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // Monthly data for BarChart
    const months = eachMonthOfInterval({ start, end });
    const monthlyData = months.map(monthDate => {
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      const monthTx = yearTx.filter(t => isWithinInterval(parseISO(t.date), { start: mStart, end: mEnd }));
      
      return {
        name: format(monthDate, 'MMM', { locale: ptBR }).replace('.', ''),
        income: monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expense: monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      };
    });

    // Category data for PieChart
    const byCategory = yearTx
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);

    const categoryData = Object.entries(byCategory).map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat?.name || 'Desconhecida',
        value: amount as number,
        color: cat?.color || '#ccc',
        icon: cat?.icon
      };
    }).sort((a, b) => b.value - a.value);

    // Biggest expenses
    const topExpenses = [...yearTx]
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return { totalIncome, totalExpense, balance, monthlyData, categoryData, topExpenses };
  }, [transactions, categories, reportYear]);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios e Análises</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-500">Ano Referência:</label>
          <select 
            className="minimal-input bg-white"
            value={reportYear}
            onChange={(e) => setReportYear(e.target.value)}
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">Receitas Recebidas no Ano</span>
          <span className="big-stat mt-2 text-green-600">{formatCurrency(reportData.totalIncome)}</span>
        </div>
        <div className="glass-card p-6 flex flex-col">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">Despesas Pagas no Ano</span>
          <span className="big-stat mt-2 text-red-600">{formatCurrency(reportData.totalExpense)}</span>
        </div>
        <div className="glass-card p-6 flex flex-col">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">Saldo Acumulado Nominal</span>
          <span className={`big-stat mt-2 ${reportData.balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            {formatCurrency(reportData.balance)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col">
          <h2 className="text-lg font-medium mb-6">Receitas x Despesas (Anual)</h2>
          <div className="h-[300px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', textTransform: 'capitalize' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `R$${val}`} />
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="income" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <h2 className="text-lg font-medium mb-6">Despesas por Categoria (Anual)</h2>
          {reportData.categoryData.length > 0 ? (
            <div className="flex-1 flex flex-col h-[300px]">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.categoryData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {reportData.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 overflow-y-auto max-h-[100px] custom-scrollbar pr-2">
                {reportData.categoryData.map(c => (
                  <div key={c.name} className="flex items-center gap-2 text-sm justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate" title={c.name}>{c.name}</span>
                    </div>
                    <span className="font-medium text-gray-700 shrink-0">{((c.value / reportData.totalExpense) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Nenhuma despesa registrada neste ano.
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-medium mb-6">Maiores Despesas do Ano</h2>
        {reportData.topExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Descrição</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Valor</th>
                </tr>
              </thead>
              <tbody>
                {reportData.topExpenses.map((tx, idx) => {
                  const cat = categories.find(c => c.id === tx.category);
                  return (
                    <tr key={tx.id} className="border-b last:border-0 border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 border-l-4" style={{ borderLeftColor: cat?.color || '#ccc' }}>
                        {tx.description}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat?.color || '#ccc'}20` }}>
                             {cat?.icon ? (
                               <IconRenderer iconName={cat.icon} className="w-3 h-3" color={cat?.color || (tx.type === 'income' ? '#22c55e' : '#ef4444')} />
                             ) : (
                               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color || (tx.type === 'income' ? '#22c55e' : '#ef4444') }} />
                             )}
                           </div>
                           <span className="truncate max-w-[120px] sm:max-w-none">{cat?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{format(parseISO(tx.date), 'dd/MM/yyyy')}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-red-600 whitespace-nowrap">
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            Nenhuma despesa para mostrar.
          </div>
        )}
      </div>

    </div>
  );
}
