# Finora — Personal Expense & Budget Tracker

A local-first expense tracker built with **React + TypeScript**, **Tailwind CSS**, **Lucide React** and **Recharts**.

All transactions, budgets and preferences are stored in the browser's `localStorage` — no backend required.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build for production

```bash
npm run build    # outputs dist/index.html
npm run preview  # preview the production build
```

The Vite config uses `vite-plugin-singlefile`, so the production output is a **single self-contained `dist/index.html`** (JS + CSS inlined). You can upload that one file anywhere.

## Deploy to Vercel

This project is set up for **GitHub + Vercel**: push the repo, import it at
[vercel.com/new](https://vercel.com/new), and Vercel builds it automatically.

- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: none

`vercel.json` and `.nvmrc` are included, so the defaults are already correct.
Every push to `main` ships to production; pull requests get preview URLs.

Full walkthrough: **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)**. `.github/workflows/ci.yml`
type-checks and builds the project on every push.

Any other static host works too: upload the generated `dist` folder. No server,
database or rewrite rules are needed.

Routing uses URL hashes (`#dashboard`, `#transactions`, `#budgets`, `#analytics`, `#settings`), so no SPA rewrite rules are required.

## Features

- Add / edit / delete income and expenses with category, payment method, date and notes
- ₹ INR / $ USD display toggle (stored in INR, converted for display)
- Search + filters by date range, category and type
- Monthly overall and per-category budgets with 75% / 90% color-coded alerts
- KPI cards, cashflow trend, category donut, weekday and payment-method analytics
- CSV export, JSON backup & restore, demo reset
- Dark-first design with a light theme, collapsible sidebar and mobile bottom nav
- Persistent storage with a pre-loaded sample month of realistic transactions
