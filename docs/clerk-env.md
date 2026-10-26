# Clerk environment variables (WayZen)

Do **not** paste secret values into chat. Put them in **repo-root** `.env` (or Cursor environment secrets) and **restart** both API and Vite.

## Why keys “did nothing”

1. Vite used to look for `.env` under `artifacts/wayzen/` only. Keys in **root** `.env` were ignored by the SPA until `envDir` pointed at the monorepo root.
2. Vite only exposes `VITE_*` (and now also `NEXT_PUBLIC_*`) to the browser. A bare `CLERK_PUBLISHABLE_KEY` is bridged by Vite config, but **`CLERK_SECRET_KEY` must stay server-side**.
3. Changing `.env` does **not** hot-reload into a running `dev:web` / `dev:api` — restart both processes.
4. Without a usable publishable key, the SPA stays in **guest** mode (no ClerkProvider) — sign-up looks broken and chat history never syncs.

## Variable map

| Variable | Who reads it | Required |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | SPA (preferred) | Yes for auth UI |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | SPA (alias) | Alternative to `VITE_*` |
| `CLERK_PUBLISHABLE_KEY` | API (+ SPA via Vite bridge) | Recommended (same `pk_…` as above) |
| `CLERK_SECRET_KEY` | API only (`sk_…`) | Yes for signed-in API / history |
| `VITE_CLERK_PROXY_URL` / `NEXT_PUBLIC_CLERK_PROXY_URL` | SPA | Optional |
| `WAYZEN_ADMIN_USER_IDS` | API | Optional (admin allowlist) |

Publishable + secret **must** belong to the **same** Clerk application. Add `http://127.0.0.1:5173` (and your preview host) to Clerk allowed origins / redirect URLs.

## Exact lines for root `.env`

```bash
# Repo root: /path/to/my_wayzen/.env  (copy from .env.example)

CLERK_PUBLISHABLE_KEY=pk_test_…          # same app as below
CLERK_SECRET_KEY=sk_test_…               # server only — never VITE_/NEXT_PUBLIC_
VITE_CLERK_PUBLISHABLE_KEY=pk_test_…     # same pk_ as CLERK_PUBLISHABLE_KEY
# Optional Next-style alias (also accepted):
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…
```

## Restart

```bash
# stop old terminals / tmux sessions, then:
npm run dev:api    # loads root .env → :5055
npm run dev:web    # loads root .env → :5173
```

## Verify (no secrets in output)

1. API log on boot: **no** line `CLERK_SECRET_KEY unset — Clerk middleware disabled`.
2. Open http://127.0.0.1:5173/sign-up — Clerk form/widget loads (not the “missing `VITE_CLERK_PUBLISHABLE_KEY`” banner).
3. After sign-in: guest AI quota banner is gone / replaced by signed-in UX; favorites & chat history can sync.
4. Optional: browser Network tab shows Clerk frontend API requests succeeding (not 401 from missing key).

## Loading paths

| Process | Loads root `.env` via |
| --- | --- |
| `npm run dev:api` | `node --env-file-if-exists=.env` + api-server `start --env-file-if-exists=../../.env` |
| `npm run dev:web` | `node --env-file-if-exists=.env` + Vite `envDir` = monorepo root |
| `npm run seed` / `db:push` | `--env-file-if-exists=../../.env` |

You do **not** need a separate `artifacts/wayzen/.env` if root `.env` is set.
