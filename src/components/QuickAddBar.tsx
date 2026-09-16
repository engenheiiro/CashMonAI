import React, { useState } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { Plus, ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react';
import { Button } from './ui/button';
import { addMonths, format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { parseAmount } from '../lib/utils';

export function QuickAddBar() {
  const { addTransaction, addRecurringBill, processRecurringBills, categories } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');
  const [keepOpen, setKeepOpen] = useState(false);

  const activeCategories = categories.filter(c => c.type === type);
  const selectedCategoryObj = categories.find(c => c.id === category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseAmount(amount);
    if (!parsedAmount || parsedAmount <= 0 || !category) {
      toast.error('Preencha um valor válido e a categoria.');
      return;
    }

    if (isRecurring) {
       const startDateParsed = parseISO(date + 'T12:00:00.000Z');
       const formattedEndDate = recurringEndDate
         ? `${recurringEndDate}-28T00:00:00.000Z`
         : addMonths(startDateParsed, 12).toISOString();

       addRecurringBill({
         name: desc || (type === 'expense' ? 'Conta Fixa' : 'Renda Recorrente'),
         amount: parsedAmount,
         category,
         dueDay: parseInt(date.substring(8, 10), 10) || 1,
         type,
         status: 'active',
         startDate: new Date(date + 'T12:00:00').toISOString(),
         endDate: formattedEndDate
       });
       processRecurringBills(); // to regenerate the transactions for the year immediately
    } else {
       addTransaction({
         amount: parsedAmount,
         category,
         subcategory: subcategory || undefined,
         date: new Date(date + 'T12:00:00').toISOString(),
         description: desc || (type === 'expense' ? 'Despesa Rápida' : 'Receita Rápida'),
         status,
         type,
       });
    }

    toast.success('Lançamento adicionado com sucesso!');

    setAmount('');
    setDesc('');
    setSubcategory('');
    setIsRecurring(false);
    setRecurringEndDate('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setStatus('paid');
    
    if (!keepOpen) {
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Button size="lg" className="shadow-lg min-w-[200px]" onClick={() => setIsOpen(true)}>
          <Plus className="mr-2" /> Adicionar Rápido
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-lg text-gray-800">Novo Lançamento</h3>
          <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>
        <div className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                type="button"
                onClick={() => { setType('expense'); setCategory(''); setSubcategory(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-medium transition-colors ${type === 'expense' ? 'bg-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}
              >
                <ArrowDownCircle className="w-4 h-4 text-red-500" /> Despesa
              </button>
              <button
                type="button"
                onClick={() => { setType('income'); setCategory(''); setSubcategory(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-medium transition-colors ${type === 'income' ? 'bg-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}
              >
                <ArrowUpCircle className="w-4 h-4 text-green-500" /> Receita
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Valor (R$)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  className="minimal-input text-lg font-mono placeholder:text-gray-400 w-full"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Data</label>
                <input
                  type="date"
                  className="minimal-input w-full bg-white"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <select
                className="minimal-input bg-white w-full"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setSubcategory(''); }}
                required
              >
                <option value="" disabled>Categoria...</option>
                {activeCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {selectedCategoryObj?.subcategories && selectedCategoryObj.subcategories.length > 0 && (
                <select
                  className="minimal-input bg-white w-full text-sm"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                >
                  <option value="">Sem subcategoria...</option>
                  {selectedCategoryObj.subcategories.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>
            
            <input
              type="text"
              placeholder="Descrição (opcional)"
              className="minimal-input"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />

            <div className="flex items-center justify-between mt-2 flex-wrap gap-3">
               {!isRecurring && (
                 <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <span className="font-medium">Status:</span>
                    <select 
                      className="minimal-input py-1 text-sm bg-white border-transparent" 
                      value={status} 
                      onChange={e => setStatus(e.target.value as 'paid' | 'pending')}
                    >
                      <option value="paid">Pago</option>
                      <option value="pending">Pendente</option>
                    </select>
                 </label>
               )}
               <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer w-full sm:w-auto mt-2 sm:mt-0">
                 <input 
                   type="checkbox" 
                   className="rounded text-blue-600" 
                   checked={isRecurring}
                   onChange={(e) => setIsRecurring(e.target.checked)}
                 />
                 <span className="font-medium">{type === 'expense' ? 'Despesa Recorrente?' : 'Renda Recorrente?'}</span>
               </label>
            </div>

            {isRecurring && (
               <div className="flex flex-col">
                 <label className="text-xs font-medium text-gray-500 mb-1 block">Fim da Recorrência (Opcional)</label>
                 <input 
                   type="month" 
                   className="minimal-input w-full bg-white text-sm" 
                   value={recurringEndDate}
                   onChange={e => setRecurringEndDate(e.target.value)}
                 />
                 <p className="text-[10px] text-gray-400 mt-1">Se em branco, assumiremos a duração de 1 ano.</p>
               </div>
            )}
            
            <div className="pt-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                 <input type="checkbox" checked={keepOpen} onChange={e => setKeepOpen(e.target.checked)} className="rounded" />
                 Manter janela aberta para adicionar mais
              </label>
            </div>

            <div className="flex gap-2 justify-end mt-2 pt-4 border-t border-gray-100">
              <Button variant="ghost" type="button" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Lançamento</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
