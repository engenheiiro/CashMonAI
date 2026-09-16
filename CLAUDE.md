# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server on port 3000
npm run build      # Production build
npm run lint       # TypeScript type checking (tsc --noEmit)
npm run preview    # Preview production build
npm run clean      # Remove dist/
```

No test runner is configured. There is a standalone logic test at [app/test.ts](app/test.ts) (run manually with `npx ts-node app/test.ts`).

A `.env` file with `GEMINI_API_KEY` is required. Copy `.env.example` to get started.

## Architecture

**CashMonAI** is a client-side personal finance app (React 19 + TypeScript + Vite + Tailwind CSS 4). All state lives in `localStorage` — there is no backend or database.

### State Management

A single React Context at [src/contexts/FinanceContext.tsx](src/contexts/FinanceContext.tsx) owns all application state:

- **`transactions`** — every income/expense record
- **`recurringBills`** — bills that auto-generate future pending transactions
- **`budgets`** — monthly planned amounts per category
- **`investments`** — savings boxes ("caixinhas") with optional goal amounts
- **`categories`** — the fixed category list (defined in [src/types.ts](src/types.ts) as `DEFAULT_CATEGORIES`)

State is serialized to `localStorage['finance_data']` on every change. The context includes migration logic for backward-compatibility with older saved data shapes.

### Recurring Bills → Transactions Pipeline

`processRecurringBills()` (in FinanceContext) is the most important business logic. When any recurring bill is created or updated:
1. All existing pending transactions linked to that bill (via `recurringBillId`) are removed.
2. New `pending` transactions are generated from `startDate` to `endDate` (defaults to 12 months ahead), one per month on `dueDay`.

This runs on mount and after any recurring bill mutation.

### Views

All views live in [src/views/](src/views/) and are rendered in [src/App.tsx](src/App.tsx) based on navigation state (no router — just `useState`).

| View | Purpose |
|---|---|
| `DashboardView` | KPIs, charts, alerts, pending items |
| `TransactionsView` | Full list with filters, mark paid/pending |
| `BudgetsView` | Planned vs actual by category/month |
| `RecurringBillsView` | Manage recurring bills |
| `ForecastView` | 6-month projected cash flow chart |
| `InvestmentsView` | Savings boxes with deposits/withdrawals |
| `CashFlowView` | Detailed running-balance table |
| `ReportsView` | Annual summaries and category breakdowns |

### Key Conventions

- **Language**: All UI text is in **Portuguese (pt-BR)**. New labels, buttons, messages, and category names must follow this.
- **Currency**: Always format with `formatCurrency()` from [src/lib/utils.ts](src/lib/utils.ts) — it uses `Intl.NumberFormat` in `pt-BR` / BRL.
- **Dates**: Use `formatDate()` for display (pt-BR locale). Dates are stored as ISO strings.
- **Styling**: Use `cn()` (clsx + tailwind-merge) for conditional class composition. Custom reusable classes are defined in [src/index.css](src/index.css): `.glass-card`, `.big-stat`, `.minimal-input`, `.text-muted`, `.btn-primary`, `.btn-secondary`.
- **Icons**: All icons go through [src/components/IconRenderer.tsx](src/components/IconRenderer.tsx), which maps kebab-case strings (e.g. `"credit-card"`) to `lucide-react` components.
- **Path alias**: `@/` resolves to the project root (e.g. `@/src/lib/utils`).

### AI Integration

`@google/genai` is installed and `GEMINI_API_KEY` is injected at build time via Vite. The Gemini client is not yet wired to any component — it's prepared for future AI features. When implementing AI calls, import from `@google/genai` and read the key from `import.meta.env.GEMINI_API_KEY`.

### Deployment Target

The app is built for **Google AI Studio** (see [metadata.json](metadata.json)). HMR is disabled when `DISABLE_HMR=true` — don't treat HMR issues as bugs in that environment.
