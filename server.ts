import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/flow-finance";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("Conectado ao MongoDB"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

// Schemas
const TransactionSchema = new mongoose.Schema({
  amount: Number,
  type: String,
  categoryId: String,
  date: String,
  note: String,
  walletId: String,
  creditCardId: String,
  status: String,
  isFixed: Boolean,
  isRecurring: Boolean,
  installment: {
    current: Number,
    total: Number
  }
});

const WalletSchema = new mongoose.Schema({
  id: String,
  name: String
});

const CategorySchema = new mongoose.Schema({
  id: String,
  name: String,
  color: String,
  icon: String
});

const GoalSchema = new mongoose.Schema({
  id: String,
  name: String,
  targetAmount: Number,
  currentAmount: Number,
  color: String,
  deadline: String
});

const CreditCardSchema = new mongoose.Schema({
  id: String,
  name: String,
  limit: Number,
  closingDay: Number,
  dueDay: Number,
  color: String
});

const Transaction = mongoose.model("Transaction", TransactionSchema);
const Wallet = mongoose.model("Wallet", WalletSchema);
const Category = mongoose.model("Category", CategorySchema);
const Goal = mongoose.model("Goal", GoalSchema);
const CreditCard = mongoose.model("CreditCard", CreditCardSchema);

const SettingsSchema = new mongoose.Schema({
  minimumBalance: Number,
  budgets: Map
});

const Settings = mongoose.model("Settings", SettingsSchema);

// API Routes
app.get("/api/settings", async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings({ minimumBalance: 0, budgets: {} });
    await settings.save();
  }
  res.json(settings);
});

app.put("/api/settings", async (req, res) => {
  const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
  res.json(settings);
});

app.get("/api/transactions", async (req, res) => {
  const transactions = await Transaction.find().sort({ date: -1 });
  res.json(transactions);
});

app.post("/api/transactions", async (req, res) => {
  const transaction = new Transaction(req.body);
  await transaction.save();
  res.json(transaction);
});

app.put("/api/transactions/:id", async (req, res) => {
  const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(transaction);
});

app.delete("/api/transactions/:id", async (req, res) => {
  await Transaction.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.delete("/api/transactions", async (req, res) => {
  await Transaction.deleteMany({});
  res.json({ success: true });
});

// Wallets
app.get("/api/wallets", async (req, res) => {
  const wallets = await Wallet.find();
  res.json(wallets);
});

app.post("/api/wallets", async (req, res) => {
  const wallet = new Wallet(req.body);
  await wallet.save();
  res.json(wallet);
});

app.delete("/api/wallets/:id", async (req, res) => {
  await Wallet.findOneAndDelete({ id: req.params.id });
  res.json({ success: true });
});

// Categories
app.get("/api/categories", async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

app.post("/api/categories", async (req, res) => {
  const category = new Category(req.body);
  await category.save();
  res.json(category);
});

// Goals
app.get("/api/goals", async (req, res) => {
  const goals = await Goal.find();
  res.json(goals);
});

app.post("/api/goals", async (req, res) => {
  const goal = new Goal(req.body);
  await goal.save();
  res.json(goal);
});

app.put("/api/goals/:id", async (req, res) => {
  const goal = await Goal.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  res.json(goal);
});

app.delete("/api/goals/:id", async (req, res) => {
  await Goal.findOneAndDelete({ id: req.params.id });
  res.json({ success: true });
});

// Credit Cards
app.get("/api/credit-cards", async (req, res) => {
  const cards = await CreditCard.find();
  res.json(cards);
});

app.post("/api/credit-cards", async (req, res) => {
  const card = new CreditCard(req.body);
  await card.save();
  res.json(card);
});

app.delete("/api/credit-cards/:id", async (req, res) => {
  await CreditCard.findOneAndDelete({ id: req.params.id });
  res.json({ success: true });
});

// Reset All
app.post("/api/reset", async (req, res) => {
  await Transaction.deleteMany({});
  await Wallet.deleteMany({});
  await Category.deleteMany({});
  await Goal.deleteMany({});
  await CreditCard.deleteMany({});
  res.json({ success: true });
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
