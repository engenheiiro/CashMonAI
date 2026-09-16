import React, { useMemo, useState } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format, isBefore, isAfter, addDays, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Bell, Info, CheckCircle2, Circle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { IconRenderer } from '../components/IconRenderer';

export function DashboardView() {
  const { transactions, categories, recurringBills, updateTransaction } = useFinance();

  const [referenceDate, setReferenceDate] = useState(new Date());
  const [pendingExpenseRange, setPendingExpenseRange] = useState<'month' | 'next30'>('month');
  const [pendingIncomeRange, setPendingIncomeRange] = useState<'month' | 'next30'>('month');
  const [categoryRange, setCategoryRange] = useState<'month' | 'next30'>('month');

  const currentMonthData = useMemo(() => {
    const now = referenceDate;
    const startM = startOfMonth(now);
    const endM = endOfMonth(now);

    const start30 = now;
    const end30 = addDays(now, 30);

    const pendingExpenseEnd = pendingExpenseRange === 'month' ? endM : end30;
    const pendingIncomeEnd = pendingIncomeRange === 'month' ? endM : end30;

    const catEnd = categoryRange === 'month' ? endM : end30;
    const catStart = categoryRange === 'month' ? startM : start30;

    // Core indicators (always this month)
    const thisMonthTx = transactions.filter(t => 
      isWithinInterval(parseISO(t.date), { start: startM, end: endM })
    );

    const pendingExpenses = transactions.filter(t => t.status === 'pending' && t.type === 'expense' && isWithinInterval(parseISO(t.date), { start: new Date(0), end: pendingExpenseEnd }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pendingIncomes = transactions.filter(t => t.status === 'pending' && t.type === 'income' && isWithinInterval(parseISO(t.date), { start: new Date(0), end: pendingIncomeEnd }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const paidThisMonthTx = thisMonthTx.filter(t => t.status === 'paid');

    const incomeThisMonth = paidThisMonthTx.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expenseThisMonth = paidThisMonthTx.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

    const totalIncome = transactions.filter(t => t.status === 'paid' && t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = transactions.filter(t => t.status === 'paid' && t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const currentBalance = totalIncome - totalExpense;

    const categoryBaseTx = transactions.filter(t => t.status === 'paid' && isWithinInterval(parseISO(t.date), { start: catStart, end: catEnd }));

    const byCategory = categoryBaseTx
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);

    const categoryData = Object.entries(byCategory).map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat?.name || 'Unknown',
        value: amount,
        color: cat?.color || '#ccc',
      };
    }).sort((a, b) => (b.value as number) - (a.value as number));

    const recent = [...paidThisMonthTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return { 
      income: incomeThisMonth, 
      expense: expenseThisMonth, 
      balance: currentBalance, 
      categoryData, 
      recent, 
      pendingExpenses, 
      pendingIncomes 
    };
  }, [transactions, categories, pendingExpenseRange, pendingIncomeRange, categoryRange, referenceDate]);

  const annualChartData = useMemo(() => {
    const now = new Date();
    const startY = startOfYear(now);
    const endY = endOfYear(now);

    const yearTx = transactions.filter(t => 
      t.status === 'paid' && isWithinInterval(parseISO(t.date), { start: startY, end: endY })
    );

    const months = eachMonthOfInterval({ start: startY, end: endY });
    return months.map(monthDate => {
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      const monthTx = yearTx.filter(t => isWithinInterval(parseISO(t.date), { start: mStart, end: mEnd }));
      
      return {
        name: format(monthDate, 'MMM', { locale: ptBR }).replace('.', ''),
        income: monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expense: monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      };
    });
  }, [transactions]);

  const alerts = useMemo(() => {
    const messages = [];
    const now = new Date();

    // Check low balance
    if (currentMonthData.balance < 100 && currentMonthData.income > 0) {
      messages.push({
        id: 'low-balance',
        type: 'warning',
        text: 'Seu saldo está baixo este mês!',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600" />
      });
    }

    // Check pending/overdue bills within transactions (expenses only)
    const pendingBills = currentMonthData.pendingExpenses;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // We compare with the start of the transaction date so today's pending bills are not categorized as "overdue" until tomorrow.
    const overdueBills = pendingBills.filter(t => {
       const txDate = new Date(t.date);
       txDate.setHours(0,0,0,0);
       return txDate.getTime() < today.getTime();
    });
    
    const upcomingBills = pendingBills.filter(t => {
       const txDate = new Date(t.date);
       txDate.setHours(0,0,0,0);
       return txDate.getTime() >= today.getTime();
    });

    if (overdueBills.length > 0) {
      messages.push({
        id: 'overdue-bills',
        type: 'danger',
        text: `Você tem ${overdueBills.length} conta(s) atrasada(s) totalizando ${formatCurrency(overdueBills.reduce((a,b)=>a+b.amount,0))}.`,
        icon: <Bell className="w-4 h-4 text-red-600" />
      });
    }

    if (upcomingBills.length > 0) {
      messages.push({
        id: 'upcoming-bills',
        type: 'info',
        text: `Você tem ${upcomingBills.length} conta(s) a vencer.`,
        icon: <Info className="w-4 h-4 text-blue-600" />
      });
    }

    return messages;
  }, [currentMonthData, transactions]);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visão Geral</h1>
          <p className="text-muted">Seu resumo financeiro (Apenas Pagos)</p>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          <button 
            onClick={() => setReferenceDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setReferenceDate(new Date())}
            className="flex items-center gap-2 px-4 py-1.5 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm text-gray-700 min-w-[140px] justify-center"
            title="Voltar para o mês atual"
          >
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="capitalize">{format(referenceDate, 'MMMM yyyy', { locale: ptBR })}</span>
          </button>

          <button 
            onClick={() => setReferenceDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
            title="Mês Próximo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div key={alert.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
              alert.type === 'danger' ? 'bg-red-50 border-red-100 text-red-800' :
              alert.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
              'bg-blue-50 border-blue-100 text-blue-800'
            }`}>
              {alert.icon}
              <span className="text-sm font-medium">{alert.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Top KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 flex flex-col">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">Saldo Atual</span>
              <span className="big-stat mt-2 text-blue-600">{formatCurrency(currentMonthData.balance)}</span>
            </div>
            <div className="glass-card p-6 flex flex-col">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">Receitas</span>
              <span className="big-stat mt-2 text-green-600">{formatCurrency(currentMonthData.income)}</span>
            </div>
            <div className="glass-card p-6 flex flex-col">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">Despesas</span>
              <span className="big-stat mt-2 text-red-600">{formatCurrency(currentMonthData.expense)}</span>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Despesas por Categoria</h2>
                <select
                  className="text-xs minimal-input bg-white"
                  value={categoryRange}
                  onChange={(e) => setCategoryRange(e.target.value as 'month' | 'next30')}
                >
                  <option value="month">Este Mês</option>
                  <option value="next30">Próx. 30 dias</option>
                </select>
              </div>
              {currentMonthData.categoryData.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={currentMonthData.categoryData}
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {currentMonthData.categoryData.map((entry, index) => (
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
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-400">
                  Nenhuma despesa paga neste período
                </div>
              )}
            </div>

            <div className="glass-card p-6 flex flex-col">
              <h2 className="text-lg font-medium mb-4">Receitas x Despesas (Anual)</h2>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={annualChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', textTransform: 'capitalize' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(val) => `R$${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: '#f3f4f6' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="income" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Pending Bills area on wide views (could be split into two cols) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 flex flex-col gap-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-red-600">A Pagar ({currentMonthData.pendingExpenses.length})</h2>
                  <div className="flex items-center gap-2">
                    <select
                      className="text-xs minimal-input bg-white"
                      value={pendingExpenseRange}
                      onChange={(e) => setPendingExpenseRange(e.target.value as 'month' | 'next30')}
                    >
                      <option value="month">Este Mês</option>
                      <option value="next30">Próx. 30 dias</option>
                    </select>
                    {currentMonthData.pendingExpenses.length > 0 && (
                      <button
                        onClick={() => {
                          currentMonthData.pendingExpenses.forEach(tx => updateTransaction(tx.id, { status: 'paid' }));
                        }}
                        className="text-xs font-medium text-red-600 hover:text-red-700 transition-all font-semibold"
                        title="Pagar Todas"
                      >
                        Pagar Todas
                      </button>
                    )}
                  </div>
                </div>
                {currentMonthData.pendingExpenses.length > 0 ? (
                  <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {currentMonthData.pendingExpenses.map(tx => {
                      const cat = categories.find(c => c.id === tx.category);
                      return (
                        <div key={tx.id} className="flex justify-between items-center p-3 bg-red-50/50 hover:bg-red-50 rounded-xl transition-colors">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateTransaction(tx.id, { status: 'paid' })}
                              className="text-red-400 hover:text-green-600 transition-colors shrink-0"
                              title="Marcar como pago"
                            >
                              <Circle className="w-5 h-5" />
                            </button>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-gray-800 truncate">{tx.description}</p>
                              <p className="text-[10px] text-gray-500">{cat?.name}{tx.subcategory && ` - ${tx.subcategory}`} • {formatDate(tx.date)}</p>
                            </div>
                          </div>
                          <div className="font-mono font-medium text-sm ml-2 shrink-0 text-red-600">
                            -{formatCurrency(tx.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">Nenhuma conta a pagar.</div>
                )}
              </div>
            </div>

            <div className="glass-card p-6 flex flex-col gap-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-green-600">A Receber ({currentMonthData.pendingIncomes.length})</h2>
                  <div className="flex items-center gap-2">
                    <select
                      className="text-xs minimal-input bg-white"
                      value={pendingIncomeRange}
                      onChange={(e) => setPendingIncomeRange(e.target.value as 'month' | 'next30')}
                    >
                      <option value="month">Este Mês</option>
                      <option value="next30">Próx. 30 dias</option>
                    </select>
                    {currentMonthData.pendingIncomes.length > 0 && (
                      <button
                        onClick={() => {
                          currentMonthData.pendingIncomes.forEach(tx => updateTransaction(tx.id, { status: 'paid' }));
                        }}
                        className="text-xs font-medium text-green-600 hover:text-green-700 transition-all font-semibold"
                        title="Receber Todas"
                      >
                        Receber Todas
                      </button>
                    )}
                  </div>
                </div>
                {currentMonthData.pendingIncomes.length > 0 ? (
                  <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {currentMonthData.pendingIncomes.map(tx => {
                      const cat = categories.find(c => c.id === tx.category);
                      return (
                        <div key={tx.id} className="flex justify-between items-center p-3 bg-green-50/50 hover:bg-green-50 rounded-xl transition-colors">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateTransaction(tx.id, { status: 'paid' })}
                              className="text-green-400 hover:text-green-600 transition-colors shrink-0"
                              title="Marcar como recebido"
                            >
                              <Circle className="w-5 h-5" />
                            </button>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-gray-800 truncate">{tx.description}</p>
                              <p className="text-[10px] text-gray-500">{cat?.name}{tx.subcategory && ` - ${tx.subcategory}`} • {formatDate(tx.date)}</p>
                            </div>
                          </div>
                          <div className="font-mono font-medium text-sm ml-2 shrink-0 text-green-600">
                            +{formatCurrency(tx.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">Nenhuma conta a receber.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-medium mb-4">Últimas Movimentações</h2>
            {currentMonthData.recent.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {currentMonthData.recent.map(tx => {
                  const cat = categories.find(c => c.id === tx.category);
                  return (
                    <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat?.color || '#ccc'}20` }}>
                          {cat?.icon ? (
                            <IconRenderer iconName={cat.icon} className="w-4 h-4" color={cat?.color || (tx.type === 'income' ? '#22c55e' : '#ef4444')} />
                          ) : (
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat?.color || (tx.type === 'income' ? '#22c55e' : '#ef4444') }} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{tx.description}</p>
                          <p className="text-xs text-gray-500">{cat?.name}{tx.subcategory && ` - ${tx.subcategory}`} • {formatDate(tx.date)}</p>
                        </div>
                      </div>
                      <div className={`font-mono font-medium text-sm ml-2 shrink-0 ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                Nenhuma transação recente
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
