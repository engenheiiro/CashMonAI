import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useExpenses } from "../context/ExpenseContext";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  AlertTriangle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Trash2,
  X,
  FileText,
  Download,
  FilterX,
  PlusCircle,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { EmptyState } from "./ui/EmptyState";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LabelList,
  Brush,
} from "recharts";
import { format, parseISO, endOfMonth, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CATEGORIES } from "../types";
import { Skeleton } from "./ui/skeleton";

export const Dashboard = () => {
  const [isClearingData, setIsClearingData] = useState(false);
  const [budgetPrompt, setBudgetPrompt] = useState<{ categoryId: string; categoryName: string } | null>(null);
  const [budgetInput, setBudgetInput] = useState("");

  const {
    balance,
    projectedBalance,
    periodBalance,
    totalIncome,
    totalExpense,
    transactions,
    allTransactions,
    selectedMonth,
    setSelectedMonth,
    budgets,
    updateBudget,
    clearAllTransactions,
    categoryFilter,
    setCategoryFilter,
    isLoading,
  } = useExpenses();

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    const element = document.getElementById("dashboard-content");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: document.documentElement.classList.contains("dark") ? "#09090b" : "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`relatorio-financeiro-${selectedMonth}.pdf`);
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o relatório.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Prepare data for pie chart
  const expensesByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, curr) => {
        acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

  const chartData = Object.entries(expensesByCategory)
    .map(([categoryId, value]) => {
      const category = CATEGORIES.find((c) => c.id === categoryId);
      return {
        id: categoryId,
        name: category?.name || "Outros",
        value: value as number,
        color: category?.color || "#cbd5e1",
      };
    })
    .sort((a, b) => b.value - a.value);

  // Prepare data for bar chart (monthly summary)
  const monthlyDataMap = allTransactions.reduce(
    (acc, curr) => {
      const monthYear = format(parseISO(curr.date), "MMM yyyy", {
        locale: ptBR,
      });
      if (!acc[monthYear]) {
        acc[monthYear] = {
          name: monthYear,
          income: 0,
          expense: 0,
          rawDate: curr.date,
        };
      }
      if (curr.type === "income") {
        acc[monthYear].income += curr.amount;
      } else {
        acc[monthYear].expense += curr.amount;
      }
      return acc;
    },
    {} as Record<
      string,
      { name: string; income: number; expense: number; rawDate: string }
    >,
  );

  const monthlyData = Object.values(monthlyDataMap)
    .sort(
      (a, b) =>
        new Date((a as any).rawDate).getTime() -
        new Date((b as any).rawDate).getTime(),
    )
    .map(({ name, income, expense }: any) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize month
      Receitas: income,
      Despesas: expense,
    }));

  const totalExpenses = chartData.reduce((acc, curr) => acc + curr.value, 0);

  const now = new Date();
  const endOfCurrentMonth = endOfMonth(now);

  const futureData = monthlyData.filter(
    (d: any) =>
      new Date(d.rawDate) > endOfCurrentMonth &&
      new Date(d.rawDate).getFullYear() <= 2026,
  );

  const pastAndCurrentData = monthlyData.filter(
    (d: any) => new Date(d.rawDate) <= endOfCurrentMonth,
  );

  // Generate list of available months for the selector
  const availableMonths = Array.from(
    new Set([
      ...allTransactions.map((t) => {
        const d = new Date(t.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }),
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    ]),
  )
    .sort()
    .reverse();

  // Group months by year
  const monthsByYear = availableMonths.reduce((acc, monthStr) => {
    const year = monthStr.split("-")[0];
    if (!acc[year]) acc[year] = [];
    acc[year].push(monthStr);
    return acc;
  }, {} as Record<string, string[]>);

  const years = Object.keys(monthsByYear).sort().reverse();

  const formatMonthOption = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return format(date, "MMMM yyyy", { locale: ptBR });
  };

  // Calculate Monthly Comparison
  const currentMonthStr = selectedMonth === "all" || selectedMonth.length === 4 ? format(new Date(), "yyyy-MM") : selectedMonth;
  const [yearNum, monthNum] = currentMonthStr.split("-").map(Number);
  const prevDate = new Date(yearNum, monthNum - 2);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const currentMonthExpense = allTransactions
    .filter(t => t.type === "expense" && t.date.startsWith(currentMonthStr))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const prevMonthExpense = allTransactions
    .filter(t => t.type === "expense" && t.date.startsWith(prevMonthStr))
    .reduce((acc, curr) => acc + curr.amount, 0);

  let expenseComparison = 0;
  if (prevMonthExpense > 0) {
    expenseComparison = ((currentMonthExpense - prevMonthExpense) / prevMonthExpense) * 100;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-700">
          <p className="font-medium text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></span>
            {data.name}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Valor: <span className="font-semibold text-zinc-900 dark:text-zinc-50">R$ {formatCurrency(data.value)}</span>
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Representa {totalExpenses > 0 ? ((data.value / totalExpenses) * 100).toFixed(1) : 0}% dos gastos
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Month Selector and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Visão Geral
          </h2>
          {categoryFilter && (
            <button
              onClick={() => setCategoryFilter(null)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <FilterX className="h-3 w-3" />
              Filtrado por: {CATEGORIES.find(c => c.id === categoryFilter)?.name}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 h-10 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            title="Gerar Relatório PDF"
          >
            {isGeneratingPDF ? (
              <div className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Relatório PDF</span>
          </button>
          <button
            onClick={() => setIsClearingData(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
            title="Apagar todos os dados"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Apagar Dados</span>
          </button>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-10 rounded-2xl border-none bg-white dark:bg-zinc-900 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-50 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 outline-none capitalize"
          >
            <option value="all">Todo o Período</option>
            {years.map((year) => (
              <optgroup key={year} label={`Ano ${year}`}>
                <option value={year}>Consolidado {year}</option>
                {monthsByYear[year].map((m) => (
                  <option key={m} value={m} className="capitalize">
                    {formatMonthOption(m)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Dashboard Content for PDF */}
      <div id="dashboard-content" className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-[300px] w-full rounded-3xl" />
              <Skeleton className="h-[300px] w-full rounded-3xl" />
            </div>
          </div>
        ) : allTransactions.length === 0 ? (
          <EmptyState
            icon={PlusCircle}
            title="Nenhuma transação encontrada"
            description="Comece adicionando sua primeira receita ou despesa para ver o resumo financeiro aqui."
          />
        ) : (
          <>
            {/* Main Balance Card */}
            <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden border-none bg-zinc-900 text-white shadow-xl">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Saldo Atual (Pago)</p>
                <motion.h1
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-1 text-4xl sm:text-5xl font-light tracking-tight font-tabular"
                >
                  R$ {formatCurrency(balance)}
                </motion.h1>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 relative group cursor-help shrink-0">
                <Wallet className="h-6 w-6 text-white" />
                <HelpCircle className="h-4 w-4 text-zinc-300 absolute -top-1 -right-1" />
                <div className="absolute -bottom-14 right-0 w-56 rounded-lg bg-zinc-800 p-2 text-xs text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none z-10 shadow-xl">
                  Este é o seu saldo real, considerando apenas as transações que já foram marcadas como pagas.
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col items-start gap-2 rounded-2xl bg-white/5 p-3 sm:p-4 backdrop-blur-sm min-w-0 border border-white/5"
              >
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold truncate">Receitas</p>
                  <p className="font-bold text-white text-xs sm:text-sm md:text-base">
                    R$ {formatCurrency(totalIncome)}
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="flex flex-col items-start gap-2 rounded-2xl bg-white/5 p-3 sm:p-4 backdrop-blur-sm min-w-0 border border-white/5"
              >
                <div className={`flex shrink-0 h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl ${periodBalance >= 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold truncate">Balanço</p>
                  <p className="font-bold text-white text-xs sm:text-sm md:text-base">
                    R$ {formatCurrency(periodBalance)}
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col items-start gap-2 rounded-2xl bg-white/5 p-3 sm:p-4 backdrop-blur-sm min-w-0 border border-white/5"
              >
                <div className="flex shrink-0 h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                  <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold truncate">Despesas</p>
                    {prevMonthExpense > 0 && selectedMonth !== "all" && (
                      <div className={`flex shrink-0 items-center gap-1 text-[10px] ${expenseComparison > 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {expenseComparison > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(expenseComparison).toFixed(0)}%
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-white text-xs sm:text-sm md:text-base">
                    R$ {formatCurrency(totalExpense)}
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="flex flex-col items-start gap-2 rounded-2xl bg-white/5 p-3 sm:p-4 backdrop-blur-sm min-w-0 border border-white/5"
              >
                <div className="flex shrink-0 h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 w-full relative group cursor-help">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold flex items-center gap-1 truncate">
                    Previsão
                    <HelpCircle className="h-3 w-3" />
                  </p>
                  <p className="font-bold text-white text-xs sm:text-sm md:text-base">
                    R$ {formatCurrency(projectedBalance)}
                  </p>
                  <div className="absolute -bottom-14 right-0 w-56 rounded-lg bg-zinc-800 p-2 text-xs text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none z-10 shadow-xl">
                    Saldo projetado considerando todas as despesas e receitas pendentes do mês.
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Summary Chart */}
      {pastAndCurrentData.length > 0 && (
        <motion.div
          key={`monthly-${transactions.length}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="mb-4 text-sm font-medium text-zinc-500">
              Resumo Mensal (Até o momento)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pastAndCurrentData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number) => `R$ ${formatCurrency(value)}`}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                  />
                  <Bar
                    dataKey="Receitas"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  >
                    <LabelList
                      dataKey="Receitas"
                      position="top"
                      formatter={(val: number) =>
                        val > 0
                          ? val >= 1000
                            ? `R$${(val / 1000).toFixed(1)}k`
                            : `R$${val}`
                          : ""
                      }
                      style={{ fill: "#64748b", fontSize: 10 }}
                    />
                  </Bar>
                  <Bar
                    dataKey="Despesas"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  >
                    <LabelList
                      dataKey="Despesas"
                      position="top"
                      formatter={(val: number) =>
                        val > 0
                          ? val >= 1000
                            ? `R$${(val / 1000).toFixed(1)}k`
                            : `R$${val}`
                          : ""
                      }
                      style={{ fill: "#64748b", fontSize: 10 }}
                    />
                  </Bar>
                  <Brush dataKey="name" height={30} stroke="#cbd5e1" fill="transparent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Analytics Section */}
      {chartData.length > 0 && (
        <motion.div
          key={`analytics-${transactions.length}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="grid gap-6 md:grid-cols-2"
        >
          <Card className="p-6">
            <h3 className="mb-4 text-sm font-medium text-zinc-500">
              Gastos por Categoria
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    onClick={(data: any) => {
                      const payload = data.payload;
                      if (categoryFilter === payload.id) {
                        setCategoryFilter(null);
                      } else {
                        setCategoryFilter(payload.id);
                        toast.info(`Filtrando por: ${payload.name}`);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-sm font-medium text-zinc-500">
              Principais Categorias & Metas
            </h3>
            <div className="space-y-6">
              {chartData.slice(0, 4).map((data, index) => {
                const categoryId = CATEGORIES.find(c => c.name === data.name)?.id || "";
                const budget = budgets[categoryId] || 0;
                const progress = budget > 0 ? Math.min((data.value / budget) * 100, 100) : 0;
                const isOverBudget = budget > 0 && data.value > budget;

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: data.color }}
                        />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-50">
                          {data.name}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          R$ {formatCurrency(data.value)}
                        </span>
                        {budget > 0 ? (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            de R$ {formatCurrency(budget)}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {((data.value / totalExpenses) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    {budget > 0 ? (
                      <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          setBudgetPrompt({ categoryId, categoryName: data.name });
                          setBudgetInput("");
                        }}
                        className="text-[10px] text-zinc-400 hover:text-emerald-500 transition-colors"
                      >
                        + Definir Meta
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Income Summary & Future Forecast */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Income Summary */}
        {pastAndCurrentData.length > 0 && (
          <motion.div
            key={`income-${transactions.length}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card className="p-6 h-full">
              <h3 className="mb-4 text-sm font-medium text-zinc-500">
                Resumo de Receitas por Mês
              </h3>
              <div className="space-y-4">
                {pastAndCurrentData.map((data, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-50">
                      {data.name}
                    </span>
                    <span className="text-sm font-semibold text-emerald-500">
                      R$ {formatCurrency(data.Receitas)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Future Forecast */}
        {futureData.length > 0 && (
          <motion.div
            key={`future-${transactions.length}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card className="p-6 h-full bg-zinc-50/50 dark:bg-zinc-900/50 border-dashed border-2 border-zinc-200 dark:border-zinc-800">
              <h3 className="mb-4 text-sm font-medium text-zinc-500 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Previsão de Gastos Futuros (Até Dez 2026)
              </h3>
              <div className="space-y-4">
                {futureData.map((data, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-50">
                      {data.name}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-semibold text-red-500">
                        - R$ {formatCurrency(data.Despesas)}
                      </span>
                      {data.Receitas > 0 && (
                        <span className="text-xs text-emerald-500">
                          + R$ {formatCurrency(data.Receitas)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </>
  )}
</div>

{/* Modals */}
      <AnimatePresence>
        {isClearingData && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsClearingData(false)}
              className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
            >
              <div className="rounded-3xl bg-white dark:bg-zinc-950 p-6 shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Apagar Tudo
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsClearingData(false)}
                    className="h-8 w-8 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                  ATENÇÃO: Você está prestes a apagar TODAS as suas transações. Esta ação NÃO pode ser desfeita. Deseja realmente apagar todos os dados?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsClearingData(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      clearAllTransactions();
                      setIsClearingData(false);
                      toast.success("Todos os dados foram apagados.");
                    }}
                  >
                    Sim, apagar tudo
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {budgetPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBudgetPrompt(null)}
              className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 p-4"
            >
              <div className="rounded-3xl bg-white dark:bg-zinc-950 p-6 shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Definir Meta
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setBudgetPrompt(null)}
                    className="h-8 w-8 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Qual o limite de gastos para <strong>{budgetPrompt.categoryName}</strong>?
                </p>
                <div className="relative mb-6">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="pl-10"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = Number(budgetInput);
                        if (!isNaN(val) && val > 0) {
                          updateBudget(budgetPrompt.categoryId, val);
                          setBudgetPrompt(null);
                          toast.success("Meta definida com sucesso!");
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setBudgetPrompt(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      const val = Number(budgetInput);
                      if (!isNaN(val) && val > 0) {
                        updateBudget(budgetPrompt.categoryId, val);
                        setBudgetPrompt(null);
                        toast.success("Meta definida com sucesso!");
                      } else {
                        toast.error("Insira um valor válido.");
                      }
                    }}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
