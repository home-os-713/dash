# Task — Google Maps Address Integration

## Communication Contract

You are a task session dispatched from the HomeOS coordination layer. Execute fully and autonomously. Permissions are pre-approved. Only stop if a required credential is missing, a decision would change product direction, or the build is broken and unfixable. When in doubt, make the reasonable choice and document it.

## Context

- Repo: https://github.com/home-os-713/dash — pull latest before starting
- Read CLAUDE.md, DECISION_LOG.md, PARTNER_BRIEFING.md before writing any code
- Stack: Next.js 16 App Router, Supabase, Tailwind CSS v4, shadcn/ui, lucide-react
- Target pages: property creation/edit modal + /dashboard/[id] property detail
- Env var needed: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (public, client-side safe)

## Task

Two things:

1. **Address autocomplete** — on property add/edit, Google Places autocomplete on the address field. Selecting a suggestion fills the address cleanly.

2. **Map pin on property detail** — on /dashboard/[id], embed a map showing the property as a pin. Should feel native to the design, not like a jarring iframe. Small and clean.

## Deliverables

- [ ] Address autocomplete on property add/edit modal
- [ ] Map pin on /dashboard/[id] property detail
- [ ] Graceful fallback if API key missing or Maps fails (hide map, don't crash)
- [ ] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY documented in CLAUDE.md (env vars section)
- [ ] Any new npm packages documented in CLAUDE.md (stack section)
- [ ] npm run build passes
- [ ] Pushed to origin/main
- [ ] Summary → .claude/dispatches/done/maps-integration.md

## Decisions already made

- Map should feel native and clean — pin only, no street view or complex controls for v1
- NEXT_PUBLIC_* is safe for Maps key but restrict it to your domains in Google Cloud Console:
  localhost:3000 and homeowner-dashboard-woad.vercel.app
- Components are client-side only ('use client') — Maps API doesn't work server-side

## Known gotchas

- proxy.ts guards page routes — Maps components are purely client-side, no route handler needed
- Tailwind v4 syntax differs from v3 — check node_modules/tailwindcss/dist/docs/ if unsure
- If using a Maps npm package, document it in CLAUDE.md
