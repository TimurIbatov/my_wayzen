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
```

Phase-1 task A: frontend `App.tsx` is split into `src/pages/*` and shared components under `src/components/*`.
