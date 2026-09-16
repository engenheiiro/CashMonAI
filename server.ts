import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.SERVER_PORT || 3001;

// ─── Schemas ─────────────────────────────────────────────────────────────────

const transactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: String,
  amount: Number,
  category: String,
  subcategory: String,
  date: String,
  status: String,
  description: String,
  isRecurring: Boolean,
  recurringBillId: String,
});

const recurringBillSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  amount: Number,
  category: String,
  dueDay: Number,
  type: String,
  status: String,
  startDate: String,
  endDate: String,
});

const budgetSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  categoryId: String,
  subcategory: String,
  plannedAmount: Number,
  month: String,
});

const investmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  type: String,
  amount: Number,
  goalAmount: Number,
  withdrawnAmount: Number,
  date: String,
  icon: String,
});

const Transaction = mongoose.model('Transaction', transactionSchema);
const RecurringBill = mongoose.model('RecurringBill', recurringBillSchema);
const Budget = mongoose.model('Budget', budgetSchema);
const Investment = mongoose.model('Investment', investmentSchema);

function toPlain(doc: mongoose.Document) {
  const obj = doc.toObject() as Record<string, unknown>;
  delete obj._id;
  delete obj.__v;
  return obj;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

app.get('/api/transactions', async (_req, res) => {
  const docs = await Transaction.find();
  res.json(docs.map(toPlain));
});

app.post('/api/transactions', async (req, res) => {
  const doc = await Transaction.create(req.body);
  res.json(toPlain(doc));
});

app.post('/api/transactions/batch', async (req, res) => {
  if (!Array.isArray(req.body) || req.body.length === 0) { res.json([]); return; }
  const docs = await Transaction.insertMany(req.body);
  res.json(docs.map(toPlain));
});

// Must come before /:id to avoid "by-bill" matching as an id
app.delete('/api/transactions/by-bill/:billId', async (req, res) => {
  await Transaction.deleteMany({ recurringBillId: req.params.billId, status: 'pending' });
  res.json({ ok: true });
});

app.put('/api/transactions/:id', async (req, res) => {
  const doc = await Transaction.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  res.json(toPlain(doc!));
});

app.delete('/api/transactions/:id', async (req, res) => {
  await Transaction.deleteOne({ id: req.params.id });
  res.json({ ok: true });
});

// ─── Recurring Bills ──────────────────────────────────────────────────────────

app.get('/api/recurring-bills', async (_req, res) => {
  const docs = await RecurringBill.find();
  res.json(docs.map(toPlain));
});

app.post('/api/recurring-bills', async (req, res) => {
  const doc = await RecurringBill.create(req.body);
  res.json(toPlain(doc));
});

app.put('/api/recurring-bills/:id', async (req, res) => {
  const doc = await RecurringBill.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  res.json(toPlain(doc!));
});

app.delete('/api/recurring-bills/:id', async (req, res) => {
  await RecurringBill.deleteOne({ id: req.params.id });
  res.json({ ok: true });
});

// ─── Budgets ──────────────────────────────────────────────────────────────────

app.get('/api/budgets', async (_req, res) => {
  const docs = await Budget.find();
  res.json(docs.map(toPlain));
});

app.post('/api/budgets', async (req, res) => {
  const doc = await Budget.create(req.body);
  res.json(toPlain(doc));
});

app.put('/api/budgets/:id', async (req, res) => {
  const doc = await Budget.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  res.json(toPlain(doc!));
});

// ─── Investments ──────────────────────────────────────────────────────────────

app.get('/api/investments', async (_req, res) => {
  const docs = await Investment.find();
  res.json(docs.map(toPlain));
});

app.post('/api/investments', async (req, res) => {
  const doc = await Investment.create(req.body);
  res.json(toPlain(doc));
});

app.put('/api/investments/:id', async (req, res) => {
  const doc = await Investment.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  res.json(toPlain(doc!));
});

app.delete('/api/investments/:id', async (req, res) => {
  await Investment.deleteOne({ id: req.params.id });
  res.json({ ok: true });
});

// ─── Reset ────────────────────────────────────────────────────────────────────

app.post('/api/reset', async (_req, res) => {
  await Promise.all([
    Transaction.deleteMany({}),
    RecurringBill.deleteMany({}),
    Budget.deleteMany({}),
    Investment.deleteMany({}),
  ]);
  res.json({ ok: true });
});

// ─── Connect & Start ──────────────────────────────────────────────────────────

mongoose.connect(process.env.MONGODB_URI!).then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`API server → http://localhost:${PORT}`));
}).catch(err => {
  console.error('MongoDB connection failed:', err.message);
  process.exit(1);
});
