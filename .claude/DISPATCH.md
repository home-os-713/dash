# HomeOS — Dispatch Protocol

This file defines how the coordination session creates and manages task sessions.
All dispatched prompts must include the Communication Contract below.

---

## Communication Contract

Include this block verbatim at the top of every dispatched task prompt:

```
## Communication Contract

You are a task session dispatched from the HomeOS coordination layer.

**Your job:**
- Read CLAUDE.md, DECISION_LOG.md, and PARTNER_BRIEFING.md before writing any code
- Execute the task fully and autonomously — do not stop to ask questions unless you are
  genuinely blocked on something that cannot be reasonably assumed
- When in doubt, make the most reasonable choice and document it in a code comment or
  commit message — do not pause for confirmation
- Permissions are pre-approved — proceed without asking for tool or action approvals

**Definition of done:**
- Code is written, tested locally (npm run build passes), and committed
- Relevant context docs updated (CLAUDE.md, DECISION_LOG.md, PARTNER_BRIEFING.md)
- All changes pushed to origin/main (or a named branch if specified)
- A brief end-of-session summary committed to .claude/dispatches/done/<task-name>.md

**Only stop and flag if:**
- A required credential or API key is missing and cannot be worked around
- The task requires a decision that would change product direction
- The build is broken and you cannot fix it

**Do not:**
- Ask for permission before using tools
- Ask clarifying questions that could be resolved by reading the context files
- Leave work half-done — complete the task or explicitly document what's left and why
```

---

## Dispatch Template

When creating a prompt for a new task session, use this structure:

```
## Communication Contract
[paste contract above]

## Context
- Repo: https://github.com/home-os-713/dash (clone or pull latest before starting)
- Read CLAUDE.md, DECISION_LOG.md, PARTNER_BRIEFING.md first
- Stack: Next.js 16, Supabase, Tailwind CSS v4, shadcn/ui, recharts, Vercel

## Task
[clear description of what to build]

## Deliverables
- [ ] [specific output 1]
- [ ] [specific output 2]
- [ ] Build passes (npm run build)
- [ ] Context docs updated
- [ ] Pushed to origin/main (or branch: [name])
- [ ] Summary written to .claude/dispatches/done/[task-name].md

## Decisions already made (do not re-litigate)
[list any relevant decisions from DECISION_LOG.md]

## Known gotchas
[pull relevant items from CLAUDE.md]
```

---

## Standard Dispatch Files

Reusable prompts for recurring task types live in `.claude/dispatches/`:

| File | Use for |
|---|---|
| `api-integration.md` | Wiring a new external API (Zillow, utilities, etc.) |
| `db-migration.md` | Supabase schema changes |
| `ui-feature.md` | New page or UI component |
| `bug-fix.md` | Debugging and fixing a broken feature |
| `sync-check.md` | Pull latest, review partner changes, update docs |

---

## Coordination session responsibilities

When dispatching:
1. Pull latest: `git pull origin main`
2. Identify the task clearly — scope it so it can run to completion without human input
3. Fill in the dispatch template with all context needed
4. Specify the branch name if not going directly to main
5. After task session completes: pull, review, merge if on a branch

When receiving back from a task session:
1. Pull latest
2. Check `.claude/dispatches/done/` for the summary
3. Verify build still passes
4. Update open items in memory file
