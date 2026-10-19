# WayZen

Personalized AI travel guide for Uzbekistan’s lesser-known places. Travelers browse a preliminary archive, plan cautious AI-assisted routes, save trips, and optionally unlock Trip Pass for higher AI limits — without inventing verified hours, prices, or safety claims.

## Run & Operate

```bash
npm install

# Copy placeholders; set real secrets via Cursor/environment secrets (never paste into chat)
cp .env.example .env

# Schema (dev) — requires DATABASE_URL
npm run db:push
# equivalent: npm run push -w @workspace/db

# Seed archive places (requires DATABASE_URL)
npm run seed
# equivalent: npm run seed -w @workspace/db

# Dev (two terminals). Defaults: API :5055, web :5173 BASE_PATH=/
npm run dev:api
npm run dev:web
# equivalents:
# PORT=5055 npm run dev -w @workspace/api-server
# PORT=5173 BASE_PATH=/ npm run dev -w @workspace/wayzen

# Quality gates (product: api-server + wayzen; mockup-sandbox excluded)
npm run typecheck
npm run build
# Frontend alone (defaults PORT=5173 BASE_PATH=/ via build:wayzen):
npm run build:wayzen
# Or explicitly:
PORT=5173 BASE_PATH=/ npm run build -w @workspace/wayzen

# After OpenAPI changes
npm run codegen
# equivalent: npm run codegen -w @workspace/api-spec
```

### Tailwind oxide / npm optional-deps

Vite/wayzen scripts run `scripts/ensure-tailwind-oxide.mjs` (also on `postinstall`): installs the platform `@tailwindcss/oxide-*` package if npm dropped it, copies the `.node` into the oxide package, and sets `NAPI_RS_NATIVE_LIBRARY_PATH` to an ASCII cache under `~/.cache/wayzen-oxide/` (helps non-ASCII paths like `Рабочий стол`).

If it still fails:

```bash
# Recommended: ASCII checkout path
mkdir -p ~/projects && cd ~/projects
git clone <your-fork-url> my_wayzen && cd my_wayzen
git checkout cursor/npm-workspaces-69f8
rm -rf node_modules package-lock.json
npm install
PORT=5173 BASE_PATH=/ npm run dev -w @workspace/wayzen
# or: npm run dev:web
```

### Environment variables

Never commit real secrets. Use placeholders / local secrets managers only.

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | API, Drizzle, seed | Postgres connection string |
| `PORT` | API, Vite | Listen / Vite port |
| `BASE_PATH` | Vite (`wayzen`) | Asset/base path (e.g. `/`) |
| `SESSION_SECRET` | API | Signs guest AI cookies |
| `GEMINI_API_KEY` | API | WayZen AI routes + chat |
| `GEMINI_MODEL` | API | Optional; default `gemini-2.5-flash-lite` |
| `CLERK_PUBLISHABLE_KEY` | API | Clerk publishable key (server middleware) |
| `CLERK_SECRET_KEY` | API | Clerk secret (proxy / production) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend | Clerk publishable key for the SPA |
| `VITE_CLERK_PROXY_URL` | Frontend | Optional Clerk proxy URL |
| `WAYZEN_ADMIN_USER_IDS` | API | Comma-separated Clerk user IDs with admin place tools |
| `STRIPE_SECRET_KEY` | API | Stripe secret for Trip Pass Checkout |
| `STRIPE_WEBHOOK_SECRET` | API | Stripe webhook signature secret |
| `STRIPE_TRIP_PASS_PRICE_ID` | API | Price / price ID for Trip Pass |
| `STRIPE_SUCCESS_URL` | API | Optional Checkout success redirect |
| `STRIPE_CANCEL_URL` | API | Optional Checkout cancel redirect |
| `STRIPE_TRIP_PASS_DAYS` | API | Optional pass length in days (default `365`) |
| `PUBLIC_APP_URL` | API | Public app origin for default Checkout URLs |
| `OFFLINE_MAPS_ENABLED` | API | Feature flag for offline-maps **stub** only (`true`/`1`/`yes`) |
| `PRIVATE_OBJECT_DIR` | API | Private object-storage directory for uploads |
| `PUBLIC_OBJECT_SEARCH_PATHS` | API | Public object-storage search paths |
| `LOG_LEVEL` | API | Optional pino level |
| `NODE_ENV` | API | `development` enables DEV-only demo Trip Pass |

Example placeholders (not real values):

```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/wayzen
GEMINI_API_KEY=your-gemini-api-key
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
SESSION_SECRET=replace-with-long-random-string
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_TRIP_PASS_PRICE_ID=price_...
PUBLIC_APP_URL=http://localhost:5173
```

## Stack

- npm workspaces, Node.js, TypeScript 5.9
- Frontend: React 19 + Vite + wouter + TanStack Query + Leaflet (+ markercluster) + Clerk
- API: Express 5 (`artifacts/api-server`)
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Contracts: OpenAPI → Orval → `@workspace/api-client-react` + `@workspace/api-zod`
- AI: Google Gemini (JSON itineraries + streaming chat)
- Billing: Stripe Checkout + webhook (env-driven); DEV demo activate stays `NODE_ENV=development` only
- Validation: Zod (`zod/v4`), `drizzle-zod`

## Where things live

| Area | Path |
| --- | --- |
| SPA pages / shell | `artifacts/wayzen/src/pages/*`, `App.tsx` (routing only) |
| Shared UI | `artifacts/wayzen/src/components/*` (`ArchiveNotice`, Header, PlaceCard, …) |
| API entry / routes | `artifacts/api-server/src/app.ts`, `routes/*` |
| AI + Trip Pass helpers | `artifacts/api-server/src/lib/{wayzenAi,tripPass,stripe}.ts` |
| DB schema | `lib/db/src/schema/{places,travelers,ai}.ts` |
| Seed | `lib/db/src/seed.mjs` (`npm run seed`) |
| OpenAPI source of truth | `lib/api-spec/openapi.yaml` |
| Theme / CSS | `artifacts/wayzen/src/index.css` |

## Architecture decisions

- **Preliminary archive, not a verified guide.** UI (`ArchiveNotice`) and AI system prompts forbid inventing hours, prices, safety, or “verified” status unless `verificationStatus === "verified"`.
- **Freemium quotas** use Samarkand calendar days: Free = 1 AI route / 10 chat messages; active Trip Pass removes daily limits (honours `tripPassExpiresAt`).
- **AI routes only use catalog slugs.** Server resolves/rejects model output against DB places; hallucinated slugs never become trip stops.
- **Stripe is optional until configured.** Without `STRIPE_*`, Checkout returns a clear configuration error; Profile still shows Upgrade CTA outside DEV. Demo `POST /api/me/trip-pass/demo` is DEV-only.
- **Offline maps are a stub.** `OFFLINE_MAPS_ENABLED` only exposes the stub UI; downloads are never faked.
- **OpenAPI is the contract.** Schema/API changes require updating `openapi.yaml`, running codegen, then typecheck.

## Product

- Browse / search preliminary places (catalog + map with clustering and filters)
- Place detail with stories, practical notes, images; favorites (signed-in or guest local)
- AI planner: draft multi-day routes from catalog; one-click save as trip
- AI chat with cautious answers grounded in the archive
- Saved trips + optional polyline of stop order on the map
- Profile / onboarding preferences; Trip Pass upgrade path
- Admin place tools for allowlisted Clerk users (`WAYZEN_ADMIN_USER_IDS`)
- Russian UI primary; place content keeps EN fields (+ `nameUz` when present)

## User preferences

- Keep stack and cautious-content rules from the Phase-1 plan; no fabricated verified claims.
- Prefer small focused files; preserve `data-testid` attributes.
- No real payment keys in the repo — env vars only.
- Russian UI primary for traveler-facing copy.

## Gotchas

- Always set `DATABASE_URL` before `npm run seed` or `npm run db:push`.
- Vite **requires** `PORT` and `BASE_PATH` even for production builds.
- After editing `lib/api-spec/openapi.yaml`, run `npm run codegen` before relying on client/Zod types.
- Guest AI usage needs `SESSION_SECRET` (signed cookie); without Gemini keys, AI endpoints return 503.
- Stripe webhook must receive the **raw** body (`/api/billing/stripe/webhook` is mounted before `express.json`).
- Seed upserts by slug; it does not invent verification — places stay `preliminary` unless reviewed.
- Catalog size is intentionally small in Phase 1 (~16 seed places); do not treat it as a complete national guide.

## Pointers

- Phase-1 backlog: product plan / acceptance lives with the project agent docs (tasks A–F).
- Workspace overview also summarized in root `README.md`.
- DB package scripts: `npm run push|seed -w @workspace/db`.
