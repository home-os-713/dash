# Dispatch Template — API Integration

## Communication Contract

You are a task session dispatched from the HomeOS coordination layer.

Your job: Execute the task fully and autonomously — do not stop to ask questions unless you are genuinely blocked on something that cannot be reasonably assumed. When in doubt, make the most reasonable choice and document it. Permissions are pre-approved.

Definition of done: Code written, npm run build passes, context docs updated, pushed to origin/main or specified branch, summary at .claude/dispatches/done/<task-name>.md.

Only stop and flag if: a required credential is missing, a decision would change product direction, or the build is broken and unfixable.

---

## Context

- Repo: https://github.com/home-os-713/dash
- Read CLAUDE.md, DECISION_LOG.md, PARTNER_BRIEFING.md before writing any code
- Stack: Next.js 16 App Router, Supabase, Tailwind CSS v4, shadcn/ui, recharts, Vercel
- API routes live in app/api/[name]/route.ts — see app/api/property-lookup/route.ts as reference
- Env vars: add to .env.local locally AND document in CLAUDE.md — Vercel vars added separately by Jaime
- Never commit .env.local

## Task

[FILL IN: describe the API to integrate and what it should do]

## Deliverables

- [ ] API route created at app/api/[name]/route.ts
- [ ] Frontend wired to call the route at the right moment
- [ ] .env.local var documented in CLAUDE.md (env vars section)
- [ ] Error state handled gracefully (don't break UI if API fails)
- [ ] npm run build passes
- [ ] CLAUDE.md updated (stack + structure sections)
- [ ] Pushed to origin/main
- [ ] Summary at .claude/dispatches/done/[task-name].md

## Decisions already made

- API keys are never committed — use process.env and document the var name
- API routes are Next.js route handlers (not edge functions) unless latency requires it
- If the API is unavailable, fall back to mock data gracefully — don't crash

## Known gotchas

- RENTCAST_API_KEY is the existing pattern — see app/api/property-lookup/route.ts
- Supabase env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- proxy.ts is the auth guard — /api/* routes are public by default, add auth if needed
