# Homeowner Dashboard — Architecture Overview

A web app where homeowners track their property finances: mortgage, equity, bills, and rental income. Each user has their own account and data.

---

## Tech Stack (TL;DR)

| Layer | Tool | Why |
|---|---|---|
| Framework | Next.js 16 (TypeScript) | Full-stack in one repo — handles pages, routing, and API routes |
| Database + Auth | Supabase (PostgreSQL) | Managed DB with built-in auth and row-level security |
| Styling | Vanilla CSS | Copied from the original prototype — clean, no framework needed |
| Deployment | Vercel | Zero-config deploys — push to `main`, it goes live automatically |

---

## System Architecture

How the three services fit together:

```mermaid
graph TD
    User["👤 User (Browser)"]

    subgraph Vercel["Vercel (Hosting)"]
        Next["Next.js App"]
        Proxy["proxy.ts\n(auth guard)"]
        Dashboard["Dashboard Page"]
        AuthCallback["/auth/callback"]
        LoginSignup["Login / Signup"]
    end

    subgraph Supabase["Supabase (Backend)"]
        Auth["Auth Service\n(email + sessions)"]
        DB[(PostgreSQL\nproperties + bills)]
    end

    User -->|"HTTP request"| Proxy
    Proxy -->|"authenticated"| Dashboard
    Proxy -->|"not authenticated"| LoginSignup
    Dashboard <-->|"read / upsert data"| DB
    LoginSignup <-->|"sign in / sign up"| Auth
    Auth -->|"confirmation email"| User
    User -->|"clicks email link"| AuthCallback
    AuthCallback -->|"exchange code"| Auth
    AuthCallback -->|"redirect"| Dashboard
```

---

## Auth Flow

What happens when a new user signs up:

```mermaid
sequenceDiagram
    actor User
    participant App as Next.js App
    participant Supabase

    User->>App: Fills out signup form
    App->>Supabase: signUp(email, password)
    Supabase-->>User: Sends confirmation email
    User->>App: Clicks email link → /auth/callback?code=...
    App->>Supabase: exchangeCodeForSession(code)
    Supabase-->>App: Returns session + user
    App-->>User: Redirects to /dashboard

    Note over User,App: On subsequent visits
    User->>App: Visits any page
    App->>Supabase: getUser() via proxy.ts
    Supabase-->>App: Valid session
    App-->>User: Shows dashboard
```

---

## Data Model

One property per user, with bills attached to that property:

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email
    }

    PROPERTIES {
        uuid id PK
        uuid user_id FK
        string name
        string address
        numeric prop_val
        numeric mort_pay
        numeric mort_bal
        numeric mort_orig
        numeric rent
        numeric rent_bills
        timestamp updated_at
    }

    BILLS {
        uuid id PK
        uuid property_id FK
        string name
        numeric amount
        string due_date
        boolean paid
    }

    USERS ||--o| PROPERTIES : "has one"
    PROPERTIES ||--o{ BILLS : "has many"
```

> Row-level security (RLS) is enforced at the database level — a user can only ever read or write their own rows, even if someone crafted a direct API request.

---

## Request Flow (Page Load)

What happens on every page request:

```mermaid
flowchart LR
    A["Browser request"] --> B["proxy.ts"]
    B --> C{Authenticated?}
    C -->|No| D["/login"]
    C -->|Yes| E["/dashboard"]
    E --> F["Load property\nfrom Supabase"]
    F --> G["Load bills\nfrom Supabase"]
    G --> H["Render dashboard\nwith user's data"]
```

---

## File Structure (Key Files)

```
app/
  dashboard/page.tsx     ← main page: state + Supabase reads/writes
  login/page.tsx         ← sign-in form
  signup/page.tsx        ← registration form
  auth/callback/route.ts ← handles email confirmation redirect
  globals.css            ← all styles (from original prototype)

proxy.ts                 ← auth guard on every request

lib/
  types.ts               ← shared types + default data
  supabase/client.ts     ← Supabase client for browser components
  supabase/server.ts     ← Supabase client for server components

components/
  PropertyHeader.tsx     ← property name, address, edit modal
  MetricsGrid.tsx        ← 4 overview cards (value, equity, cash flow, bills)
  MortgageCard.tsx       ← mortgage balance + progress bar
  EquityCard.tsx         ← SVG donut chart
  BillsList.tsx          ← monthly bills + add bill
  RentalCard.tsx         ← rental income breakdown
  SpendingChart.tsx      ← horizontal bar chart
  Modal.tsx              ← reusable modal wrapper
```

---

## Planned Next Steps

- **Vercel deploy** — connect GitHub repo, set env vars, get a live URL
- **Google + Apple sign-in** — OAuth via Supabase (Auth → Providers)
- **External data integrations** — Zillow (property value), utility APIs (bills), Google Calendar (due date reminders), mortgage servicer APIs
- **Multi-property support** — current model is one property per user
- **Analytics section** — re-add once real data sources are connected
