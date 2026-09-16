import React, { useState } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency, parseAmount } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Trash2, Edit2 } from 'lucide-react';
import { format, parseISO, addMonths } from 'date-fns';
import { IconRenderer } from '../components/IconRenderer';

export function RecurringBillsView() {
  const { recurringBills, categories, addRecurringBill, updateRecurringBill, deleteRecurringBill, processRecurringBills } = useFinance();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [endDate, setEndDate] = useState('');
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM'));
  const [type, setType] = useState<'expense' | 'income'>('expense');

  const [viewTab, setViewTab] = useState<'expense' | 'income'>('expense');

  const handleEditClick = (b: any) => {
    setEditingId(b.id);
    setName(b.name);
    setAmount(b.amount.toString());
    setCategory(b.category);
    setDueDay(b.dueDay.toString());
    setType(b.type || 'expense');
    setStartDate(b.startDate ? b.startDate.substring(0, 7) : format(new Date(), 'yyyy-MM'));
    setEndDate(b.endDate ? b.endDate.substring(0, 7) : ''); // format yyyy-MM
    setIsFormOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setName('');
    setAmount('');
    setCategory('');
    setDueDay('1');
    setType(viewTab);
    setStartDate(format(new Date(), 'yyyy-MM'));
    setEndDate('');
    setIsFormOpen(!isFormOpen);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseAmount(amount);
    const parsedDueDay = parseInt(dueDay, 10);
    if (!name || !parsedAmount || parsedAmount <= 0 || !category) return;
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) return;

    const formattedStartDate = `${startDate}-01T12:00:00.000Z`;

    // Add day to endDate to make it a full date, using 28 to avoid month overflow issues
    // If not provided, defaults to 1 year from startDate
    let formattedEndDate: string | undefined;
    if (endDate) {
       formattedEndDate = `${endDate}-28T00:00:00.000Z`;
    } else {
       formattedEndDate = addMonths(parseISO(formattedStartDate), 12).toISOString();
    }

    if (editingId) {
       updateRecurringBill(editingId, {
         name,
         amount: parsedAmount,
         category,
         dueDay: parsedDueDay,
         type,
         startDate: formattedStartDate,
         endDate: formattedEndDate
       });
    } else {
       addRecurringBill({
         name,
         amount: parsedAmount,
         category,
         dueDay: parsedDueDay,
         type,
         status: 'active',
         startDate: formattedStartDate,
         endDate: formattedEndDate
       });
    }
    
    processRecurringBills();
    
    setIsFormOpen(false);
    setEditingId(null);
  };

  const activeCategories = categories.filter(c => c.type === type);
  const displayedBills = recurringBills.filter(b => b.type === viewTab || (viewTab === 'expense' && !b.type));

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contas Recorrentes</h1>
          <p className="text-muted">Gerencie assinaturas e contas mensais</p>
        </div>
        <Button onClick={handleAddNewClick}>
          {isFormOpen && !editingId ? 'Cancelar' : 'Nova Conta'}
        </Button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSave} className="glass-card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 pb-2 border-b subtle-border">
            <h2 className="text-lg font-medium">{editingId ? 'Editar Conta' : 'Nova Conta'}</h2>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Nome da Conta</label>
            <input type="text" className="minimal-input w-full" value={name} onChange={e => setName(e.target.value)} required placeholder="ex: Netflix, Aluguel"/>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Valor</label>
            <input type="number" step="0.01" className="minimal-input w-full" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00"/>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Categoria</label>
            <select className="minimal-input w-full bg-white" value={category} onChange={e => setCategory(e.target.value)} required>
              <option value="" disabled>Selecionar</option>
              {activeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Tipo</label>
            <select className="minimal-input w-full bg-white" value={type} onChange={e => setType(e.target.value as 'expense' | 'income')} required>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Vencimento (1-31)</label>
            <input type="number" min="1" max="31" className="minimal-input w-full" value={dueDay} onChange={e => setDueDay(e.target.value)} required/>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Início</label>
            <input type="month" className="minimal-input w-full bg-white" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Fim (Opcional)</label>
            <input type="month" className="minimal-input w-full bg-white" value={endDate} onChange={e => setEndDate(e.target.value)} />
            <p className="text-[10px] text-gray-400 mt-1">Se em branco, assumiremos a duração de 1 ano.</p>
          </div>
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button type="submit">{editingId ? 'Salvar Alterações' : 'Criar Conta'}</Button>
          </div>
        </form>
      )}
      
      {!isFormOpen && (
        <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button
               className={`pb-2 px-2 text-sm font-medium transition-colors border-b-2 ${viewTab === 'expense' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
               onClick={() => setViewTab('expense')}
            >
                Despesas
            </button>
            <button
               className={`pb-2 px-2 text-sm font-medium transition-colors border-b-2 ${viewTab === 'income' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
               onClick={() => setViewTab('income')}
            >
                Receitas
            </button>
        </div>
      )}

      {displayedBills.length === 0 && !isFormOpen && (
        <div className="text-center p-12 glass-card text-gray-500">
          {viewTab === 'expense' ? 'Nenhuma despesa recorrente definida.' : 'Nenhuma receita recorrente definida.'}
        </div>
      )}

      <div className="space-y-8">
        {Array.from(new Set(displayedBills.map(b => b.category))).map(catId => {
          const cat = categories.find(c => c.id === catId);
          const billsInCat = displayedBills.filter(b => b.category === catId);
          
          if (billsInCat.length === 0) return null;

          return (
            <div key={catId}>
               <h3 className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 {cat?.icon && <IconRenderer iconName={cat.icon} className="w-4 h-4" />}
                 {cat?.name || 'Sem categoria'}
               </h3>
               <div className="grid gap-4 md:grid-cols-2">
                 {billsInCat.map(b => (
                    <div key={b.id} className="glass-card p-5 flex justify-between items-start group">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className={`w-3 h-3 rounded-full ${b.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} 
                            title={b.type === 'income' ? 'Receita Recorrente' : 'Despesa Recorrente'} 
                          />
                          <h3 className="font-semibold truncate">{b.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500">Vence dia {b.dueDay}</p>
                        {b.endDate && (
                          <p className="text-xs font-medium text-amber-600 mt-1">Vai até: {format(parseISO(b.endDate), 'MM/yyyy')}</p>
                        )}
                        <div className={`mt-3 font-mono text-lg ${b.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {b.type === 'income' ? '+' : '-'}{formatCurrency(b.amount)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditClick(b)}
                          className="text-gray-400 hover:text-blue-500"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                                if (window.confirm('Excluir esta conta recorrente? Transações já geradas não serão apagadas.')) {
                                    deleteRecurringBill(b.id);
                                }
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
