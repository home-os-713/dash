# Task — Rentcast Property Data Sync

## Communication Contract

You are a task session dispatched from the HomeOS coordination layer. Execute fully and autonomously. Permissions are pre-approved. Only stop if a required credential is missing, a decision would change product direction, or the build is broken and unfixable. When in doubt, make the reasonable choice and document it.

## Context

- Repo: https://github.com/home-os-713/dash — pull latest before starting
- Read CLAUDE.md, DECISION_LOG.md, PARTNER_BRIEFING.md before writing any code
- Stack: Next.js 16 App Router, Supabase, Tailwind CSS v4, shadcn/ui, lucide-react
- Existing reference: app/api/property-lookup/route.ts already calls Rentcast — read it first
- Env var: RENTCAST_API_KEY (already in .env.local locally)

## Task

Wire Rentcast to automatically populate property value and rent estimate when a user adds or edits a property — eliminating manual input. When the user enters a property address, fetch from Rentcast and pre-fill relevant fields. User can still override manually.

## Deliverables

- [ ] Address input on property add/edit triggers Rentcast lookup (debounced)
- [ ] Pre-fills: property value, estimated rent — plus any other fields Rentcast returns that map to schema
- [ ] Loading state shown while fetching
- [ ] Graceful fallback if Rentcast fails — fields stay blank, no crash, user can still input manually
- [ ] CLAUDE.md updated (env vars section)
- [ ] npm run build passes
- [ ] Pushed to origin/main
- [ ] Summary → .claude/dispatches/done/rentcast-sync.md

## Decisions already made

- API keys never committed — process.env.RENTCAST_API_KEY only
- Fallback to manual input if API unavailable — never block the user
- Schema: prop_val (property value), rent — see CLAUDE.md for full schema

## Known gotchas

- /api/* routes are public by default (proxy.ts only guards page routes)
- localhost and production share the same Supabase DB
