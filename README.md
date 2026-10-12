# WayZen

Personalized AI travel guide for Uzbekistan hidden places.

See **[`replit.md`](./replit.md)** for product description, full env list, run commands, and architecture notes.

## Monorepo

pnpm workspaces:

- `artifacts/wayzen` — React + Vite frontend
- `artifacts/api-server` — Express API
- `lib/db` — Drizzle + Postgres
- `lib/api-spec` / `lib/api-client-react` — OpenAPI + Orval client

```bash
pnpm install
pnpm run typecheck
pnpm db:push                 # apply schema (needs DATABASE_URL)
pnpm seed                    # seed archive places (needs DATABASE_URL)
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/wayzen run build
```

Trip Pass (no secrets in repo): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_TRIP_PASS_PRICE_ID`, optional `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` / `STRIPE_TRIP_PASS_DAYS`, `OFFLINE_MAPS_ENABLED`, `PUBLIC_APP_URL`. Demo activate remains DEV-only at `POST /api/me/trip-pass/demo`.
