# Homeowner Dashboard

A personal property management dashboard for homeowners. Track your mortgage, equity, rental income, bills, and spending — all in one place.

## What it does

- Property overview: estimated value, home equity, monthly cash flow
- Mortgage tracker: remaining balance, principal paid, payoff progress
- Bills manager: monthly bills with due dates and payment status
- Rental income tracker: rent, expenses, and net cash flow
- Analytics: value trends and equity growth projections

## Tech stack

- **Next.js** (App Router, TypeScript)
- **Supabase** (auth + PostgreSQL database)
- **Vercel** (deployment)

## Running locally

```bash
npm install
cp .env.local.example .env.local
# Fill in your Supabase credentials in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deployed on Vercel. Push to `main` triggers an automatic redeploy.
