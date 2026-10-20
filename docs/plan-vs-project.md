# WayZen — plan vs project

**Audit date:** 2026-10-20  
**Code tip:** `cursor/npm-workspaces-69f8` / PR #3 stack (`#1` Phase-1 product → `#2` dark shell + i18n → `#3` npm workspaces)  
**Sources:** Phase-1 plan (`phase1-mvp-plan.md` tasks A–F), TZ presentation roadmap (attached asset), current repo.

> Design note (this workstream): Netlify dark landing ([reference](https://lambent-nougat-96a634.netlify.app/)) is the **visual source of truth** for landing + AI chrome. Product routes stay intact.

---

## Honest progress

| Scope | Estimate | Comment |
| --- | --- | --- |
| **Phase-1 MVP (plan A–F + TZ §5.1)** | **~82–88%** | Core product loop is built; gaps are content depth, live Stripe/Clerk verification in prod, PWA/offline, catalog scale |
| **TZ 2025 MVP launch readiness** | **~75–80%** | Guest + signed-in paths exist; 50–80 verified places and polished storytelling still short |
| **2026 Growth** | **~15–25%** | Stripe foundation + multi-day AI routes partial; offline maps / 50–80 places / partnerships largely missing |
| **2027+ Scale** | **~0–5%** | Partner B2B / bookings / CA regions not started (data hooks only if any) |

---

## Phase-1 backlog (A–F)

| Task | Status | Evidence |
| --- | --- | --- |
| **A. Frontend refactor** | **Done** | Pages under `artifacts/wayzen/src/pages/*`; `App.tsx` is routing/shell only; shared components + `data-testid`s |
| **B. Content quality** | **Partial** | Seed ~16 preliminary places; hand-written stories for many (PR history ~11+); **not** 50–80 verified; admin CRUD exists for allowlisted users |
| **C. Map improvements** | **Done** | Leaflet + marker clustering, category/region filters, trip stop polyline |
| **D. Trip Pass foundation** | **Partial → mostly done** | DEV demo trip-pass; env-driven Stripe Checkout + webhook; Profile upgrade CTA; offline maps **stub** + `OFFLINE_MAPS_ENABLED` (no fake downloads) |
| **E. AI polish** | **Done** | Catalog slug grounding, save-as-trip, quota display; guest + signed-in streaming chat |
| **F. Docs & DX** | **Done** (npm era) | `replit.md`, `.env.example`, root `dev:api` / `dev:web`, seed/db:push scripts; pnpm → **npm** workspaces on PR #3 |

---

## TZ presentation vs code

### Done (or solid)

- PostgreSQL + Drizzle places / travelers / favorites / trips / AI conversations + usage
- Interactive map with filters + clusters
- Freemium quotas (Free: 1 AI route / 10 chat msgs per Samarkand day; Trip Pass lifts limits)
- Clerk accounts + cloud favorites/trips (wired; needs real keys in deploy)
- Streaming Gemini AI chat + AI route generation grounded in catalog
- Archive disclaimers / no fabricated verified claims
- Admin place tools (`WAYZEN_ADMIN_USER_IDS`)
- RU primary UI + EN/ZH/AR i18n shell (beyond original RU/EN ask)
- Dark product shell; Netlify-style landing now on `/` (this PR)

### Partial

- Storytelling + photos: present for a subset of seed places; not launch-scale polish
- Trip Pass: Stripe code path ready; **live payments unproven** without secrets; demo remains DEV-only
- Offline maps: stub/flag only (correctly not faked)
- Personalization: profile preferences + onboarding exist; deeper “profile-aware” recommendations still light
- Multi-day routes: AI planner supports N days; external routing API not fully productionized
- Multilingual **content** (UZ fields): schema support / `nameUz` when present; not full UZ UI content

### Missing vs TZ / roadmap

| Item | Horizon | Notes |
| --- | --- | --- |
| 50–80 **verified** places | 2025–26 | Still ~16 preliminary |
| Real production Trip Pass checkout + support | 2026 | Code ready; ops/keys/QA pending |
| Offline map packs (PWA + SW) | 2026 | Stub only |
| Export (PDF / GPX / share link) | 2026 | Not present |
| Partner cabinet / bookings / B2B API | 2027+ | Not started |
| Central Asia regions | 2027+ | Not started |
| Notifications / AI usage analytics dashboards | later | Basic logging only if any |

### MVP acceptance (TZ §6) — quick score

| Criterion | Status |
| --- | --- |
| Guest: browse, search, local planner ideas, AI with limit | **Met** (AI needs `GEMINI_API_KEY`) |
| Signed-in: sync, history, personalization | **Mostly met** (Clerk + JWT bridge; live E2E needs keys) |
| Map shows places with filters | **Met** |
| ≥1 full storytelling + photo on 10+ places | **Mostly met** (seed enrichment; quality varies) |
| Disclaimers for unverified | **Met** |
| Trip Pass (even test) lifts AI limits + offline stub | **Met in DEV** / Stripe path for prod |

---

## Stack delta vs original plan

Plan assumed **pnpm**. Current tip is **npm workspaces** (PR #3) with Vite `/api` proxy, Clerk guest shell when keys missing, oxide binding helpers for Linux/non-ASCII paths. Product behavior preserved.

---

## Next priorities (recommended order)

1. **Content sprint:** grow toward 50+ places; real verification workflow; consistent stories/photos  
2. **Production auth + billing:** real Clerk + Stripe keys, webhook in staging, pass expiry QA  
3. **Landing → activation funnel:** keep Netlify aesthetic; measure “Начать путешествие” → first AI message  
4. **PWA / offline shell** (Growth): real region packs behind Trip Pass  
5. **Exports + shareable trip links**  
6. **Partners / B2B** only after Growth content + payments are stable  

---

## Design workstream (companion)

Applied on branch `cursor/netlify-landing-aesthetic-69f8`:

- `/` is a full-bleed Netlify-style landing (italic **WayZen**, teal tagline, violet primary CTA, teal outline sign-in, grain + atmospheric glows)
- Product routes (`/ai`, map, atlas, planner, …) remain; shell tokens aligned (Outfit, violet/teal CTAs, grain)
- Screenshots: `media/preview-netlify-*.png` (when store writable) / `/opt/cursor/artifacts/`

---

*Generated for the project agent store path `docs/plan-vs-project.md`. If the store mount was unavailable, this file also lives in the repo under `docs/plan-vs-project.md`.*
