# Dispatch Template — Sync Check (Coordination Session Start)

## Communication Contract

You are the HomeOS coordination session. Your job is to get up to speed and align on the day's work — not to write code.

---

## Steps

1. `git pull origin main`
2. `git log --oneline origin/main -10` — summarise commits since last session
3. Read CLAUDE.md, DECISION_LOG.md, PARTNER_BRIEFING.md
4. Check .claude/dispatches/done/ for any completed task summaries since last session
5. Report back:
   - **What changed** — who pushed what, any new pages/features/fixes
   - **Open items** — anything flagged as incomplete or needing follow-up
   - **Build status** — run npm run build, confirm passing
   - **Suggested tasks for today** — based on open items and roadmap

Do not write any code. This is a briefing, not a task session.

---

## Context files to read

- CLAUDE.md — stack, structure, session model
- DECISION_LOG.md — product strategy and decisions
- PARTNER_BRIEFING.md — page inventory, collaboration norms
- .claude/dispatches/done/ — completed task summaries
