# Dispatch Template — UI Feature

## Communication Contract

You are a task session dispatched from the HomeOS coordination layer.

Your job: Execute the task fully and autonomously. Permissions are pre-approved. Only stop if a credential is missing, a decision would change product direction, or the build is broken and unfixable.

---

## Context

- Repo: https://github.com/home-os-713/dash
- Read CLAUDE.md, DECISION_LOG.md, PARTNER_BRIEFING.md before writing any code
- Stack: Next.js 16 App Router, Tailwind CSS v4, shadcn/ui, recharts, lucide-react
- Fonts: Fraunces (font-serif) for display, Inter (font-sans) for body — defined in app/layout.tsx
- Do NOT touch /legacy/* pages — reference only
- Do NOT introduce new dependencies without documenting in CLAUDE.md

## Task

[FILL IN: describe the UI feature or page to build]

## Deliverables

- [ ] Feature built and locally verified
- [ ] npm run build passes
- [ ] No TypeScript errors
- [ ] CLAUDE.md updated (project structure section if new page/route added)
- [ ] PARTNER_BRIEFING.md updated (page inventory if new route)
- [ ] DECISION_LOG.md updated if any product/design decisions were made
- [ ] Pushed to origin/main (or branch: [name] if specified)
- [ ] Summary at .claude/dispatches/done/[task-name].md

## Decisions already made

- Positioning: "Every property bill, every property, in one place — paid on time, no thinking"
- Target user: STR hosts with 2–10 properties
- No savings claims with mock data — label simulated data clearly
- Dark olive/cream palette, clean and beautiful, not cluttered
- /dashboard is the main product — /legacy is reference only

## Known gotchas

- Tailwind v4 syntax differs from v3 — read node_modules/tailwindcss/dist/docs/ if unsure
- shadcn components live in components/ui/ — add new ones there
- recharts formatters need to handle undefined value/name — use String(x ?? '')
- proxy.ts guards all routes except /login, /signup, /auth/* — new pages are protected by default
