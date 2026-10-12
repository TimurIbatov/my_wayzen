# WayZen

Personalized AI travel guide for Uzbekistan hidden places.

## Monorepo

pnpm workspaces:

- `artifacts/wayzen` — React + Vite frontend
- `artifacts/api-server` — Express API
- `lib/db` — Drizzle + Postgres
- `lib/api-spec` / `lib/api-client-react` — OpenAPI + Orval client

```bash
pnpm install
pnpm --filter @workspace/wayzen run typecheck
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/wayzen run build
pnpm --filter @workspace/db run push   # apply schema (incl. trip_pass_expires_at)
pnpm --filter @workspace/db run seed   # after DATABASE_URL is set
```

Trip Pass (no secrets in repo): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_TRIP_PASS_PRICE_ID`, optional `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` / `STRIPE_TRIP_PASS_DAYS`, `OFFLINE_MAPS_ENABLED`, `PUBLIC_APP_URL`. Demo activate remains DEV-only at `POST /api/me/trip-pass/demo`.
