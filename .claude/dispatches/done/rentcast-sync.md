# Done — Rentcast Property Data Sync

Branch: `dispatch/rentcast-sync`

## What was built
Rentcast now **automatically** populates property value and rent estimate when a user adds or edits a property — replacing the old manual "Look up value" button.

- **Add property modal** (`app/dashboard/page.tsx`): typing an address fires a debounced Rentcast lookup and pre-fills **Est. value** (`prop_val`), **Monthly income** (rent estimate → `income`/`rent`), and **Location** (`city, state`). Auto-fill never overwrites a field the user has manually edited (tracked via a dirty-field `useRef` set). Loading spinner + "auto-filled" Sparkles hint; failures are silent and fall back to manual entry.
- **Edit property modal** (`app/dashboard/[id]/page.tsx`): lookup is keyed off the property's **stored `prop.address`** and runs while the modal is open. It auto-fills only **blank** value/income fields (never silently overwrites saved data) and exposes an explicit **"Apply Rentcast estimates"** button (showing the $ figures) to override existing values on demand. `savePropEdit` now persists both `income` and `rent`.
- **Shared hook** `lib/useRentcastLookup.ts`: 700ms debounce, min 8 chars, `AbortController` drops stale responses, never throws. Returns `{ data, loading, error }`. Used by both modals.
- **API route** `app/api/property-lookup/route.ts`: added a third parallel fetch to `/v1/avm/rent/long-term` so the response now includes `rentEstimate`/`rentRangeLow`/`rentRangeHigh`. Wrapped in try/catch (returns clean error JSON, never crashes the caller). Dev mock extended with rent fields. Prod still 503s without the key; 30-day `unstable_cache` unchanged.

## Files changed
- `app/api/property-lookup/route.ts` (modified) — rent endpoint + try/catch
- `app/dashboard/page.tsx` (modified) — Add modal auto-sync, removed manual button
- `app/dashboard/[id]/page.tsx` (modified) — Edit modal auto-sync + rent persistence
- `lib/useRentcastLookup.ts` (new) — shared debounced hook
- `CLAUDE.md` (modified) — structure, Rentcast gotchas, auto-sync section
- `DECISION_LOG.md` (modified) — Round 12 entry

## Decisions / assumptions
- **Auto-fill is non-destructive** — Add protects user-edited fields via a dirty set; Edit only auto-fills blanks and requires an explicit click to override saved values. (See DECISION_LOG Round 12.)
- **Edit modal does NOT add an address `<input>`** — the parallel **Maps** task owns the address field in that same modal. To avoid a collision, the Edit lookup keys off the existing `prop.address`. **Overlap to flag at merge:** both tasks touch the Edit Property modal in `app/dashboard/[id]/page.tsx`. My changes sit in the value/income area + a status row after Location; I did not add or move an address input. When Maps lands an editable address field, repoint the lookup at that form state (one-line change) so it re-fires on edits.
- Income and rent are kept in sync (income field maps to both `income` and `rent` columns), matching the existing Add-modal behavior.

## Build status
- `npm run build` **passes** (Next.js 16.2.4 / Turbopack). `tsc --noEmit` clean (exit 0).
- **Gotcha resolved:** the worktree's `node_modules` symlink (→ main worktree) makes Turbopack fatal-error ("Symlink points out of the filesystem root"). Replaced it with a real `npm install` in the worktree (node_modules is gitignored, nothing committed). Future worktree builds hitting this error just need a local `npm install`.

## Needs the coordination session
- **`RENTCAST_API_KEY` must be set in Vercel** (Production env) for prod lookups — otherwise prod returns 503 and fields stay manual. It's already in local `.env.local`. Free tier = 50 req/mo; route caches 30 days/address.
- **Coordinate with the Maps task** on the Edit-modal address field before/at merge (see overlap note above).
- Minor: `proxy.ts`'s matcher actually catches `/api/*` (redirects unauthed API calls to `/login`, 307) — contrary to the dispatch's "api routes are public" note. In-app it's fine because the authenticated session cookie rides along with the same-origin fetch. Not changed here; flagging for awareness.
