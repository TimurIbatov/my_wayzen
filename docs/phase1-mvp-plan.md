# WayZen Phase-1 MVP — plan & backlog

Personalized AI travel guide for Uzbekistan hidden places. Freemium: Free (1 AI route/day, 10 chat msgs/day) vs Trip Pass. Stack: pnpm monorepo, React+Vite (`artifacts/wayzen`), Express (`artifacts/api-server`), Drizzle+Postgres (`lib/db`), OpenAPI+Orval (`lib/api-spec`), Clerk.

## Current state (~70% Phase 1)

Present and must not regress:

- DB: `wayzen_places`, traveler profiles, favorites, trips, conversations, chat messages, AI usage
- APIs: places, profile, favorites, trips, AI routes, chat, admin places, storage, demo trip-pass
- Frontend: large single `App.tsx` (Leaflet, Clerk, React Query from `@workspace/api-client-react`)
- Content: ~16 preliminary archive places (templated stories); demo Trip Pass DEV-only; offline maps stub

## Rules

1. Keep stack: pnpm workspaces, Express 5, Drizzle, Zod v4, Orval, Clerk, Leaflet, React Query, wouter.
2. Never invent opening hours, prices, safety, or claim verified unless `verificationStatus === "verified"`.
3. Preserve ArchiveNotice / cautious AI system prompts.
4. After schema or OpenAPI changes: update `lib/db`, `openapi.yaml`, run codegen, keep types in sync.
5. Prefer small focused files — extract pages and feature components.
6. Russian UI primary; keep EN content fields; add `nameUz` when data exists.
7. No real payment keys in repo; env vars only. Demo trip-pass stays DEV-only until Stripe is wired.

## Tasks (order)

### A. Refactor frontend (start here)

- Split `App.tsx` into pages: Home, Catalog, PlaceDetail, Map, Planner, Favorites, Trips, TripDetail, AIChat, Profile, Onboarding, AdminPlaces, Auth wrappers
- Shared: Header, Footer, ArchiveNotice, PlaceCard, EmptyState, LoadError
- Keep all `data-testid` attributes

### B. Content quality

- Extend seed and/or admin so ≥10 places have hand-written `storyRu`/`storyEn` (2–4 paragraphs), practical notes, 1–3 image URLs, tags, seasonality, `accessDifficulty`
- Keep others preliminary; never mark verified without real review
- Support image upload via existing storage endpoints in AdminPlaces

### C. Map improvements

- Marker clustering
- Category/region filters on map view
- Optional: polyline between trip stops; external directions OK

### D. Trip Pass monetization foundation

- Keep `/me/trip-pass/demo` DEV-only
- Env-driven Stripe Checkout + webhook → `plan = trip_pass` (+ expiry if needed)
- Profile UI: real Upgrade CTA when not DEV; clear plan status
- Offline maps: clear stub + feature flag; do not fake download

### E. AI polish

- Prefer place slugs from DB; reject hallucinated slugs
- One-click “Save as trip” from GeneratedRoute
- Show remaining quota from profile

### F. Docs & DX

- Real `replit.md`: product, env list, run commands, architecture
- pnpm script for seed

## Acceptance

- Typecheck and build pass
- Signed-in user: profile, favorites, AI route within quota, save trip, map markers, admin if `isAdmin`
- Free limits enforced; Trip Pass removes them
- No fabricated verified claims; disclaimers visible
- `App.tsx` no longer contains all page logic

## Roadmap gaps (later)

- P1: PWA/offline, i18n UI, AI tool-calling, admin bulk-import
- P2: partners/bookings, CA regions, analytics
