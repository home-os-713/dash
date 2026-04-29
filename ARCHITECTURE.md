# Homeowner Dashboard — Architecture Overview

A web app where homeowners track their property finances: mortgage, equity, bills, and rental income. Each user has their own account and data.

**Status:** Live and fully functional — auth, data persistence, and Vercel deployment are all in place.

---

## Tech Stack (TL;DR)

| Layer | Tool | Why | Used in |
|---|---|---|---|
| Framework | Next.js 16 (TypeScript) | Full-stack in one repo — handles pages, routing, and API routes | everywhere |
| Database + Auth | Supabase (PostgreSQL) | Managed DB with built-in auth and row-level security | `/dashboard` |
| Styling | Vanilla CSS | Copied from the original prototype — clean, no framework needed | `/dashboard` |
| Styling | Tailwind CSS v4 | Utility-first CSS — partner's prototype page | `/homeos` |
| UI Components | shadcn/ui | Pre-built Card, Badge components (copied into `components/ui/`) | `/homeos` |
| Charts | Inline SVG | Zero-dependency charts computed directly in components | `/dashboard` |
| Charts | recharts | AreaChart, BarChart for utility + financial data | `/homeos` |
| Icons | lucide-react | Icon library | `/homeos` |
| Deployment | Vercel | Zero-config deploys — push to `main`, it goes live automatically | everywhere |

---

## System Architecture

How the three services fit together:

```mermaid
graph TD
    User["👤 User (Browser)"]

    subgraph Vercel["Vercel (Hosting)"]
        Proxy["proxy.ts\n(auth guard)"]
        Dashboard["/dashboard\n(live data, Supabase)"]
        HomeOS["/homeos\n(prototype, mock data)"]
        AuthCallback["/auth/callback"]
        LoginSignup["Login / Signup"]
    end

    subgraph Supabase["Supabase (Backend)"]
        Auth["Auth Service\n(email + sessions)"]
        subgraph DB["PostgreSQL"]
            Props[("properties\n(one per user)")]
            Bills[("bills\n(many per property)")]
        end
    end

    User -->|"HTTP request"| Proxy
    Proxy -->|"authenticated"| Dashboard
    Proxy -->|"authenticated"| HomeOS
    Proxy -->|"not authenticated"| LoginSignup
    Dashboard -->|"on load: SELECT by user_id"| Props
    Dashboard -->|"on load: SELECT by property_id"| Bills
    Dashboard -->|"on edit: UPSERT"| Props
    Dashboard -->|"on add bill: INSERT"| Bills
    Props -->|"property data"| Dashboard
    Bills -->|"bills list"| Dashboard
    LoginSignup <-->|"sign in / sign up"| Auth
    Auth -->|"confirmation email"| User
    User -->|"clicks email link"| AuthCallback
    AuthCallback -->|"exchange code for session"| Auth
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

## Request Flow (Page Load + Edits)

What happens on every page request and user interaction:

```mermaid
flowchart LR
    A["Browser request"] --> B["proxy.ts"]
    B --> C{Authenticated?}
    C -->|No| D["/login"]
    C -->|Yes| E["/dashboard"]
    E --> F["SELECT from properties\nWHERE user_id = me"]
    F --> G["SELECT from bills\nWHERE property_id = mine"]
    G --> H["Render dashboard\nwith user's data"]
    H --> I{User edits\na value}
    I -->|"property field\n(value, mortgage, rent)"| J["UPSERT properties\nrow in DB"]
    I -->|"adds a bill"| K["INSERT into\nbills table"]
    J & K --> H
```

---

## File Structure (Key Files)

```
app/
  dashboard/page.tsx     ← main page: useReducer state + all Supabase reads/writes
  homeos/page.tsx        ← partner's prototype: multi-property vision, mock data only
  login/page.tsx         ← sign-in form
  signup/page.tsx        ← registration form
  auth/callback/route.ts ← handles email confirmation code → session exchange
  globals.css            ← all styles for /dashboard (keep as-is, no Tailwind)

proxy.ts                 ← Next.js 16 auth guard (was middleware.ts — do not rename)

lib/
  types.ts               ← shared types + default data + fmt() utility
  utils.ts               ← cn() Tailwind class helper (used by /homeos)
  supabase/client.ts     ← Supabase client for browser ('use client') components
  supabase/server.ts     ← Supabase client for server components and routes

components/
  PropertyHeader.tsx     ← property name, address, edit modal
  MetricsGrid.tsx        ← 4 overview cards (value, equity, cash flow, bills)
  MortgageCard.tsx       ← mortgage balance + progress bar
  EquityCard.tsx         ← SVG donut chart
  BillsList.tsx          ← monthly bills + add bill
  RentalCard.tsx         ← rental income breakdown
  SpendingChart.tsx      ← horizontal bar chart
  Modal.tsx              ← reusable modal wrapper
  ui/
    card.tsx             ← shadcn Card (used by /homeos)
    badge.tsx            ← shadcn Badge (used by /homeos)
```

---

## Planned Next Steps

- **Merge /dashboard and /homeos** — combine the best UI/features from /homeos with the real data layer from /dashboard into a single unified page. Requires choosing a styling system (Tailwind vs vanilla CSS) and extending the DB schema for multi-property support. /homeos can then be removed.
- **Multi-property support** — extend DB schema (properties table currently one-per-user)
- **Google + Apple sign-in** — OAuth via Supabase (Auth → Providers)
- **Zillow API** — auto-fill property value and neighborhood comps
- **Utility provider APIs** — pull electricity, water/sewer, gas bills automatically
- **Google Calendar / iCal** — surface bill due dates as reminders
- **Mortgage servicer APIs** — pull live balance, payment history, escrow
- **Analytics & insights section** — re-add once real data sources feed it
