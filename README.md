# WayZen

Personalized AI travel guide for Uzbekistan hidden places.

See **[`replit.md`](./replit.md)** for product description, full env list, run commands, and architecture notes.

## Monorepo

npm workspaces:

- `artifacts/wayzen` — React + Vite frontend
- `artifacts/api-server` — Express API
- `lib/db` — Drizzle + Postgres
- `lib/api-spec` / `lib/api-client-react` — OpenAPI + Orval client

```bash
npm install
npm run typecheck
npm run db:push                 # apply schema (needs DATABASE_URL)
npm run seed                    # seed archive places (needs DATABASE_URL)
PORT=5173 BASE_PATH=/ npm run build -w @workspace/wayzen
```

Trip Pass (no secrets in repo): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_TRIP_PASS_PRICE_ID`, optional `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` / `STRIPE_TRIP_PASS_DAYS`, `OFFLINE_MAPS_ENABLED`, `PUBLIC_APP_URL`. Demo activate remains DEV-only at `POST /api/me/trip-pass/demo`.
