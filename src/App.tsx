import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './contexts/FinanceContext';
import { QuickAddBar } from './components/QuickAddBar';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { BudgetsView } from './views/BudgetsView';
import { RecurringBillsView } from './views/RecurringBillsView';
import { ForecastView } from './views/ForecastView';
import { InvestmentsView } from './views/InvestmentsView';
import { CashFlowView } from './views/CashFlowView';
import { ReportsView } from './views/ReportsView';
import { LayoutDashboard, ArrowRightLeft, PieChart, CalendarSync, Menu, X, TrendingUp, Landmark, Trash2, List, BarChart3 } from 'lucide-react';
import { Toaster } from 'sonner';

type ViewType = 'dashboard' | 'transactions' | 'budgets' | 'bills' | 'forecast' | 'investments' | 'cashflow' | 'reports';

const NAV_ITEMS: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Visão Geral', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'reports', label: 'Relatórios', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'transactions', label: 'Transações', icon: <ArrowRightLeft className="w-5 h-5" /> },
  { id: 'cashflow', label: 'Fluxo de Caixa', icon: <List className="w-5 h-5" /> },
  { id: 'budgets', label: 'Orçamentos', icon: <PieChart className="w-5 h-5" /> },
  { id: 'bills', label: 'Contas Recorrentes', icon: <CalendarSync className="w-5 h-5" /> },
  { id: 'forecast', label: 'Previsão Mensal', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'investments', label: 'Investimentos', icon: <Landmark className="w-5 h-5" /> },
];

function MainLayout() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { resetWallet } = useFinance();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'reports': return <ReportsView />;
      case 'transactions': return <TransactionsView />;
      case 'cashflow': return <CashFlowView />;
      case 'budgets': return <BudgetsView />;
      case 'bills': return <RecurringBillsView />;
      case 'forecast': return <ForecastView />;
      case 'investments': return <InvestmentsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f5f5] overflow-hidden font-sans">
      {/* Mobile Nav Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b subtle-border z-40 flex items-center justify-between px-4">
        <h1 className="font-semibold text-lg tracking-tight"><span className="text-green-500">Cash</span>MonAI</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -mr-2">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-[#f5f5f5] border-r subtle-border transform transition-transform duration-300
        lg:relative lg:translate-x-0 pt-20 lg:pt-8 pb-8 px-4 flex flex-col gap-2
        ${mobileMenuOpen ? 'translate-x-0 bg-white shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="hidden lg:block px-4 mb-6">
          <h1 className="font-semibold text-xl tracking-tight"><span className="text-green-500">Cash</span>MonAI</h1>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium
                ${currentView === item.id 
                  ? 'bg-white shadow-sm text-black' 
                  : 'text-gray-500 hover:text-black hover:bg-black/5'}
              `}
            >
              <div className={currentView === item.id ? 'text-black' : 'text-gray-400'}>
                {item.icon}
              </div>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto px-4 pt-4 border-t subtle-border">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              Redefinir Dados
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-20 lg:pt-8 px-4 lg:px-12 relative w-full items-start pb-safe">
        <div className="max-w-7xl mx-auto w-full">
          {renderView()}
        </div>
        <QuickAddBar />
      </main>
      
      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-20 bg-black/20 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                    <Trash2 className="w-6 h-6" />
                    <h2 className="text-lg font-semibold tracking-tight">Redefinir Dados</h2>
                </div>
                <p className="text-gray-600 text-sm mb-6">
                    Tem certeza que deseja apagar todos os dados da sua carteira? Esta ação <strong className="font-medium text-black">não pode ser desfeita</strong>.
                </p>
                <div className="flex items-center justify-end gap-3">
                    <button 
                        onClick={() => setShowResetConfirm(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => {
                            resetWallet();
                            setShowResetConfirm(false);
                            setCurrentView('dashboard');
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                    >
                        Sim, apagar tudo
                    </button>
                </div>
            </div>
        </div>
      )}
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <MainLayout />
    </FinanceProvider>
  );
}
