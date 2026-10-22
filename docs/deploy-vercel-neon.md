# Deploy WayZen on Vercel + Neon

**Hosting choice:** Frontend + API on **Vercel** (Next.js) · Database on **Neon** (Postgres).  
**Branch tip this doc targets:** `cursor/vercel-neon-deploy-69f8` (from PR #5 catalog seed).

Do **not** paste secrets into chat. Set them in Neon / Vercel / local `.env` only.

---

## What ships now (Phase 1) vs later

| Phase | Ships | Status |
| --- | --- | --- |
| **1 — this PR** | Next app `@workspace/web` with Route Handlers: `/api/healthz`, `/api/places`, `/api/places/[slug]`, `/api/overview`; lazy Neon-ready `DATABASE_URL` pool; `vercel.json`; deploy checklist | **In repo** |
| **2 — follow-up** | Embed Vite SPA (landing / AI / map / admin) into Next (static export or App Router migration); proxy or rewrite so one Vercel URL serves UI + API | Planned |
| **3 — follow-up** | Port remaining Express routes: AI chat/routes (SSE), Clerk-gated travelers, admin CRUD, Stripe webhook, storage uploads | Planned |
| **4 — optional** | Full page migration off Vite; retire Express for production | Optional |

**Local full product today:** keep using `npm run dev:api` + `npm run dev:web` (Express + Vite). Phase 1 does not replace that loop; it adds a Vercel-deployable API slice on Neon.

Netlify landing aesthetic and the **50 preliminary** seed stay as-is. Never mark places `verified` without real review.

---

## Architecture (pragmatic)

```
┌─────────────────┐     DATABASE_URL      ┌──────────────┐
│  Vercel (Next)  │ ───────────────────► │ Neon Postgres │
│  artifacts/web  │                      │  Drizzle ORM  │
│  /api/* handlers│                      └──────────────┘
└────────┬────────┘
         │ Phase 2: same origin for SPA
         ▼
┌─────────────────┐
│ Vite SPA (now)  │  artifacts/wayzen — local / future embed
│ Express (now)   │  artifacts/api-server — full AI/auth until ported
└─────────────────┘
```

- Shared DB package: `@workspace/db` (lazy pool; SSL auto for Neon URLs).
- Zod contracts: `@workspace/api-zod` (same shapes as Express).
- Seed / schema push: still `npm run db:push` and `npm run seed` against Neon `DATABASE_URL`.

---

## User checklist (no secrets in chat)

### A. Neon

1. Create a Neon project (region close to your Vercel region).
2. Copy the **pooled** connection string (recommended for serverless) into a password manager.
3. Locally (never in chat):

```bash
cp .env.example .env
# Set DATABASE_URL=<neon pooled URL>
npm run db:push
npm run seed
```

4. Confirm:

```bash
# against Neon via any client, or temporarily:
# PORT=5055 npm run dev:api  →  curl localhost:5055/api/overview
# expect placesTotal ≥ 50, all preliminary
```

### B. Vercel project

1. Import the GitHub repo into Vercel.
2. **Root Directory:** `artifacts/web` (Next app). Root `vercel.json` runs install/build from the monorepo root via `cd ../..`.
3. Framework preset: Next.js (from `vercel.json`).
4. Add **Environment Variables** (Production + Preview as needed):

| Variable | Required Phase 1 | Notes |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | Neon pooled URL |
| `PUBLIC_APP_URL` | Recommended | e.g. `https://your-app.vercel.app` |
| `GEMINI_API_KEY` | Phase 3 | AI chat/routes |
| `SESSION_SECRET` | Phase 3 | Guest AI cookies |
| `CLERK_PUBLISHABLE_KEY` | Phase 3 | Auth |
| `CLERK_SECRET_KEY` | Phase 3 | Auth |
| `VITE_CLERK_PUBLISHABLE_KEY` | SPA / Phase 2 | Frontend Clerk |
| `WAYZEN_ADMIN_USER_IDS` | Phase 3 | Admin allowlist |
| `STRIPE_*` | Optional | Trip Pass |

5. Deploy. Smoke-test:

```text
GET https://<vercel-host>/api/healthz     → { "status": "ok" }
GET https://<vercel-host>/api/overview   → placesTotal ≥ 50
GET https://<vercel-host>/api/places     → array length ≥ 50
```

### C. Local Next API (optional)

```bash
npm install
# DATABASE_URL=... in repo-root `.env` (Neon or local Postgres)
npm run dev:web-next
# → http://127.0.0.1:3000/api/places
# (script loads root `.env` via node --env-file-if-exists)
```

Point Vite at the Next API later with `API_PROXY_TARGET=http://127.0.0.1:3000` if you want hybrid local testing.

---

## Monorepo layout

| Path | Role |
| --- | --- |
| `artifacts/web` | Next.js App Router + Phase 1 API routes (`@workspace/web`) |
| `artifacts/wayzen` | Vite React SPA (full product UI) |
| `artifacts/api-server` | Express (full API until ported) |
| `lib/db` | Drizzle schema + seed |
| `vercel.json` | Vercel install/build from monorepo root (set Root Directory to `artifacts/web`) |

---

## Follow-up priorities

1. Embed SPA build into Next (same domain, cookies, Clerk).
2. Port SSE AI routes (`/api/wayzen/chat`, Gemini conversations) — watch Vercel function duration / streaming limits.
3. Port Clerk middleware + travelers / admin / Stripe webhook (raw body).
4. Object storage for admin photo upload on Vercel-compatible storage (or keep stub until then).

---

## Safety

- Seed and admin must keep `verificationStatus=preliminary` unless a human verifies.
- No fabricated hours, prices, or safety claims.
- Rotate any key that was ever pasted into chat or a ticket.
