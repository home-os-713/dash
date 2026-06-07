# Dispatch Template — DB Migration

## Communication Contract

You are a task session dispatched from the HomeOS coordination layer.

Your job: Execute the task fully and autonomously. Permissions are pre-approved. Only stop if a credential is missing, a decision would change product direction, or the build is broken and unfixable.

---

## Context

- Repo: https://github.com/home-os-713/dash
- Read CLAUDE.md, DECISION_LOG.md, PARTNER_BRIEFING.md before writing any code
- Supabase project: https://supabase.com/dashboard/project/feorwntlkwhwrsehmjmd
- Migrations live in supabase/ — see 001_multi_property.sql and 002_sort_order.sql as reference
- RLS (Row Level Security) is enabled — every new table needs policies
- Schema changes must be reflected in CLAUDE.md (database schema section)

## Task

[FILL IN: describe the schema change needed]

## Deliverables

- [ ] Migration SQL file created at supabase/00N_<name>.sql
- [ ] SQL includes RLS policies if adding new tables
- [ ] TypeScript types updated in lib/v0/db.ts or lib/types.ts
- [ ] CLAUDE.md database schema section updated
- [ ] npm run build passes
- [ ] Pushed to origin/main
- [ ] Summary at .claude/dispatches/done/[task-name].md
- [ ] NOTE: SQL must be run manually in Supabase SQL Editor — flag this in the summary

## Decisions already made

- One-to-many properties per user (multi-property schema already live via 001_multi_property.sql)
- Bills cascade delete when property is deleted
- Users cascade delete when auth.users row is deleted (FK fixed with ON DELETE CASCADE)
- sort_order column exists on properties (002_sort_order.sql)

## Known gotchas

- Always add ON DELETE CASCADE to FK references to auth.users — Supabase dashboard delete will fail otherwise
- RLS policies are per-table — don't forget them on new tables
- localhost and production share the same Supabase DB — migrations run in SQL Editor affect prod immediately
