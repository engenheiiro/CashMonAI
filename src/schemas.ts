import { z } from "zod";

export const transactionSchema = z.object({
  id: z.string(),
  amount: z.number().positive("O valor deve ser maior que zero"),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data inválida",
  }),
  note: z.string().max(200, "A nota deve ter no máximo 200 caracteres"),
  walletId: z.string().optional(),
  creditCardId: z.string().optional(),
  status: z.enum(["paid", "pending"]).optional(),
  isFixed: z.boolean().optional(),
  installment: z.object({
    current: z.number(),
    total: z.number(),
  }).optional(),
  isRecurring: z.boolean().optional(),
});

export const walletSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "O nome da carteira é obrigatório"),
});

export const creditCardSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "O nome do cartão é obrigatório"),
  limit: z.number().positive("O limite deve ser maior que zero"),
  closingDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
  color: z.string(),
});

export const goalSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "O nome da meta é obrigatório"),
  targetAmount: z.number().positive("O valor alvo deve ser maior que zero"),
  currentAmount: z.number().nonnegative(),
  color: z.string(),
  deadline: z.string().optional(),
});
