export type TransactionType = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

export type Wallet = {
  id: string;
  name: string;
};

export type CreditCard = {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
};

export type Transaction = {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // ISO string
  note: string;
  walletId?: string;
  creditCardId?: string;
  status?: 'paid' | 'pending';
  isFixed?: boolean;
  installment?: { current: number; total: number };
  isRecurring?: boolean;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  deadline?: string;
};

export const CATEGORIES: Category[] = [
  { id: "food", name: "Alimentação", color: "#f97316", icon: "Utensils" },
  { id: "ifood", name: "iFood/Delivery", color: "#ef4444", icon: "Pizza" },
  {
    id: "supermarket",
    name: "Supermercado",
    color: "#10b981",
    icon: "ShoppingCart",
  },
  { id: "transport", name: "Transporte", color: "#3b82f6", icon: "Bus" },
  { id: "uber", name: "Uber/Táxi", color: "#000000", icon: "Car" },
  { id: "fuel", name: "Combustível", color: "#f59e0b", icon: "Fuel" },
  {
    id: "shopping",
    name: "Shopping/Roupas",
    color: "#ec4899",
    icon: "ShoppingBag",
  },
  { id: "entertainment", name: "Lazer", color: "#8b5cf6", icon: "PartyPopper" },
  { id: "cinema", name: "Cinema/Teatro", color: "#6366f1", icon: "Film" },
  { id: "bills", name: "Contas", color: "#14b8a6", icon: "Zap" },
  { id: "health", name: "Saúde", color: "#ef4444", icon: "Heart" },
  { id: "education", name: "Educação", color: "#f59e0b", icon: "BookOpen" },
  { id: "home", name: "Casa", color: "#84cc16", icon: "Home" },
  { id: "travel", name: "Viagem", color: "#06b6d4", icon: "Plane" },
  { id: "salary", name: "Salário", color: "#10b981", icon: "Briefcase" },
  { id: "freelance", name: "Freelance", color: "#3b82f6", icon: "Laptop" },
  {
    id: "investment",
    name: "Investimento",
    color: "#6366f1",
    icon: "TrendingUp",
  },
  { id: "other", name: "Outros", color: "#6b7280", icon: "MoreHorizontal" },
];
