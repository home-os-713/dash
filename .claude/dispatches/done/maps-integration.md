# Done — Google Maps Address Integration

**Branch:** `dispatch/maps-integration` (do NOT merge to main without coordinator review)
**Build:** ✅ `npm run build` passes (Next.js 16.2.4, Turbopack). New files lint clean (0 errors).

## What was built

### 1. Address autocomplete (add-property modal)
Google Places autocomplete on the address field of the **Add property** modal in `app/dashboard/page.tsx`. Selecting a suggestion fills the address cleanly (Google's `formatted_address`) and, as a bonus, auto-fills the "Location" field with the parsed `City, ST` **only when the user hasn't already typed a location** (no clobbering).

### 2. Map pin (property detail)
A small (`h-44 sm:h-52`), clean, pin-only map on `/dashboard/[id]` (the `RealPropertyDetail` component), placed right below the hero banner and above the KPI cards. Custom basemap styling tuned to the warm-editorial palette, themed for **both light and dark** mode (keys off the `.dark` class at map-init). No street view, no default UI, no POIs — just an olive teardrop pin matching the brand accent.

### 3. Graceful degradation (the key contract)
Everything is gated behind a `mapsConfigured` flag (`lib/maps.ts`). With **no `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** (the current local + prod state):
- `AddressAutocomplete` renders an ordinary text input — identical styling, same value/onChange contract — no autocomplete, no crash.
- `PropertyMap` returns `null` (the whole block collapses) — no broken/empty map box.
- Same fallback if the SDK fails to load (bad key, referrer restriction, network) or geocoding finds nothing.

Verified locally: key is absent, build passes, `/login` + `/signup` render (200), `/dashboard` correctly redirects unauthed → `/login` (307), no console/compile errors.

## Files changed

| File | Change |
|---|---|
| `lib/maps.ts` | **new** — client-only Maps SDK loader (`loadMapLibs`, `loadPlacesLib`, `mapsConfigured`). Dynamically `import()`s the loader to avoid SSR `window` crash. |
| `components/AddressAutocomplete.tsx` | **new** — Places-autocomplete address input, drop-in for a plain `<input>`, graceful fallback. |
| `components/PropertyMap.tsx` | **new** — pin-only map, light/dark styled, self-hides on missing key / geocode failure. |
| `app/dashboard/page.tsx` | Address `<input>` in the Add-property modal swapped for `<AddressAutocomplete>` (+ import). |
| `app/dashboard/[id]/page.tsx` | Added `<PropertyMap>` below the hero in `RealPropertyDetail` (+ import). |
| `app/globals.css` | Themed the Google-injected `.pac-container` autocomplete dropdown (light/dark, z-60 above modal). |
| `CLAUDE.md` | Documented the package, the env var, project-structure entries, and a gotcha. |
| `package.json` / `package-lock.json` | New dep. |

## New npm package
- `@googlemaps/js-api-loader` (^2.1.0) — runtime
- `@types/google.maps` — dev dep (the loader's only transitive runtime dep is these types)

Chose the lean official loader over a React wrapper (`@react-google-maps/api` / `@vis.gl/react-google-maps`) to keep the surface small and avoid pulling React-rendering abstractions for two simple components.

## Decisions / assumptions
- **Used the modal's existing free-text `address` field as the autocomplete target** (see merge note below). Did not add a new DB column — the map geocodes the stored `address` (falls back to `location`) at view time, so no schema change was needed. Lat/lng from a selected suggestion is captured by `AddressAutocomplete` but **not yet persisted** (no `lat`/`lng` columns exist); the map geocodes on load instead. If you later add `lat`/`lng` columns, `PropertyMap` already accepts them as props to skip geocoding.
- No DECISION_LOG round added — this didn't change product direction (the dispatch pre-decided "native, pin-only, graceful fallback"). All decisions were within that envelope.
- **SSR gotcha worth knowing:** `@googlemaps/js-api-loader` v2 reads `window` at module-eval, which threw during prerender of the client `/dashboard` page. Fixed by dynamically importing the loader inside `lib/maps.ts`'s functions (browser-only paths).

## What still needs the coordination session
1. **Create the API key** in Google Cloud Console and enable: **Maps JavaScript API**, **Places API**, **Geocoding API**.
2. **Restrict the key** to HTTP referrers `localhost:3000` + `homeowner-dashboard-woad.vercel.app` (and the three APIs above).
3. **Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** in `.env.local` locally AND in Vercel → Project → Settings → Environment Variables.
   - Until set, autocomplete falls back to a plain input and the map is hidden (by design — nothing breaks).
4. **Merge coordination with the parallel Rentcast task** — both edit the same address field (see note in the report / commit message).
