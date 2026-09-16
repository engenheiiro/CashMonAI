import React, { useMemo } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency } from '../lib/utils';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

export function ForecastView() {
  const { recurringBills } = useFinance();

  const forecastData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    // Sum of all active recurring expenses and incomes
    const totalExpenses = recurringBills
      .filter(b => b.status === 'active' && b.type === 'expense')
      .reduce((sum, b) => sum + b.amount, 0);

    const totalIncome = recurringBills
      .filter(b => b.status === 'active' && b.type === 'income')
      .reduce((sum, b) => sum + b.amount, 0);

    for (let i = 1; i <= 6; i++) {
        const targetMonth = addMonths(now, i);
        // capitalize first letter of the month
        const monthStr = format(targetMonth, 'MMM/yy', { locale: ptBR });
        const monthCapitalized = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);

        data.push({
            month: monthCapitalized,
            Receitas: totalIncome,
            Despesas: totalExpenses,
            Saldo: totalIncome - totalExpenses
        })
    }

    return data;
  }, [recurringBills]);

  const activeExpenseBills = recurringBills.filter(b => b.status === 'active' && b.type === 'expense');
  const activeIncomeBills = recurringBills.filter(b => b.status === 'active' && b.type === 'income');

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Previsão Mensal</h1>
        <p className="text-muted">Projeção de receitas e despesas fixas para os próximos 6 meses</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card p-6">
            <h2 className="text-lg font-medium mb-4">Projeção Mensal</h2>
            <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis 
                    tickFormatter={(val) => new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short', style: 'currency', currency: 'BRL' }).format(val)} 
                    tick={{ fontSize: 12, fill: '#666' }} 
                    axisLine={false} 
                    tickLine={false} 
                    dx={-10}
                />
                <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </ComposedChart>
            </ResponsiveContainer>
            </div>
        </div>
        
        <div className="glass-card p-6 flex flex-col xl:row-span-2">
            <h2 className="text-lg font-medium mb-4">Composição (Valores Fixos)</h2>
            
            <div className="flex-1 overflow-y-auto w-full">
                <h3 className="text-sm font-semibold text-green-600 mb-2 mt-2 uppercase tracking-wider">Receitas Fixas</h3>
                <div className="divide-y subtle-border mb-4">
                    {activeIncomeBills.map(b => (
                        <div key={b.id} className="flex justify-between py-2">
                            <span className="text-sm font-medium">{b.name}</span>
                            <span className="font-mono text-sm text-green-600">{formatCurrency(b.amount)}</span>
                        </div>
                    ))}
                    {activeIncomeBills.length === 0 && (
                        <p className="text-gray-500 py-2 text-sm italic">Nenhuma receita fixa</p>
                    )}
                </div>

                <h3 className="text-sm font-semibold text-red-600 mb-2 uppercase tracking-wider">Despesas Fixas</h3>
                <div className="divide-y subtle-border">
                    {activeExpenseBills.map(b => (
                        <div key={b.id} className="flex justify-between py-2">
                            <span className="text-sm font-medium">{b.name}</span>
                            <span className="font-mono text-sm text-red-600">{formatCurrency(b.amount)}</span>
                        </div>
                    ))}
                    {activeExpenseBills.length === 0 && (
                        <p className="text-gray-500 py-2 text-sm italic">Nenhuma despesa fixa</p>
                    )}
                </div>
            </div>
            
            <div className="pt-4 border-t subtle-border mt-4">
                <div className="flex justify-between items-center text-sm mb-1 text-green-600">
                    <span>Total Receitas</span>
                    <span className="font-mono font-medium">{formatCurrency(activeIncomeBills.reduce((sum, b) => sum + b.amount, 0))}</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-3 text-red-600">
                    <span>Total Despesas</span>
                    <span className="font-mono font-medium">{formatCurrency(activeExpenseBills.reduce((sum, b) => sum + b.amount, 0))}</span>
                </div>
                {(() => {
                    const totalInc = activeIncomeBills.reduce((sum, b) => sum + b.amount, 0);
                    const totalExp = activeExpenseBills.reduce((sum, b) => sum + b.amount, 0);
                    const diff = totalInc - totalExp;
                    return (
                        <div className={`flex justify-between items-center font-semibold text-lg border-t subtle-border pt-2 ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <div>
                                <span>Saldo Projetado/Mês</span>
                                <p className="text-[10px] font-normal opacity-80 mt-0.5 leading-tight text-gray-500">
                                    (Receitas - Despesas Fixas)
                                </p>
                            </div>
                            <span className="font-mono whitespace-nowrap">
                                {formatCurrency(diff)}
                            </span>
                        </div>
                    );
                })()}
            </div>
        </div>
      </div>
    </div>
  );
}
