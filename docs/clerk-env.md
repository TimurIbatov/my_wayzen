# Clerk environment variables (WayZen)

Do **not** paste secret values into chat. Put them in **repo-root** `.env` and **fully restart** API + Vite.

## Why `/sign-up` still shows “VITE_CLERK_PUBLISHABLE_KEY not set”

Typical causes (in order):

1. **Old Vite process** — HMR does not reload env. Kill the terminal / tmux session and start again.
2. **Wrong file location** — keys must be in **monorepo root** `.env` (next to `package.json`), not only under `artifacts/wayzen/`. Tip Vite loads **both**, but root is canonical.
3. **Wrong filename** — `.env.txt` / `env` / `.env.rtf` are ignored. Name must be exactly `.env` (or `.env.local`).
4. **Not on tip** — need the envDir + bridge fix: `git pull` on `cursor/vercel-neon-deploy-69f8` (PR #6).
5. **Placeholder / invalid `pk_`** — example `pk_test_...` from `.env.example` is rejected. Use a real Clerk publishable key from the same app as `sk_`.
6. **Spaces / bad quotes** — prefer no quotes: `VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxx` (no spaces around `=`).

On Vite start you should see:

```text
[wayzen] clerkPublishableKeyLoaded: true
```

If it prints `false`, the SPA will stay in guest / missing-key mode.

## Variable map

| Variable | Who reads it | Required |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | SPA (preferred) | Yes for auth UI |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | SPA (alias) | Alternative |
| `CLERK_PUBLISHABLE_KEY` | API + SPA (bridged by Vite) | Recommended |
| `CLERK_SECRET_KEY` | API only | Yes for history / sync |
| `VITE_CLERK_PROXY_URL` / `NEXT_PUBLIC_CLERK_PROXY_URL` | SPA | Optional |
| `WAYZEN_ADMIN_USER_IDS` | API | Optional admin allowlist |

Publishable + secret must be from the **same** Clerk application. Allow `http://127.0.0.1:5173` (and your preview host) in Clerk.

## Exact root `.env` lines

File: `<repo>/.env` (copy from `.env.example`).

```bash
CLERK_PUBLISHABLE_KEY=pk_test_…
CLERK_SECRET_KEY=sk_test_…
VITE_CLERK_PUBLISHABLE_KEY=pk_test_…
# optional alias:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…
```

## Commands to verify

```bash
git pull origin cursor/vercel-neon-deploy-69f8
# confirm tip includes check script:
npm run check:clerk-env
# expect: clerkPublishableKeyLoaded: true  and  clerkSecretKeyLoaded: true

# fully restart (do not rely on HMR) — kill old Vite on :5173 first:
# Ctrl+C both terminals / stop tmux, then:
npm run dev:api
npm run dev:web
# Vite must listen on :5173 (not :5055). Log must include:
#   [wayzen] clerkPublishableKeyLoaded: true

# browser:
open http://127.0.0.1:5173/sign-up
# → Clerk widget (not missing-key banner)
```

Note: root `.env` may contain `PORT=5055` for the API. `npm run dev:web` forces **5173** so that value does not bind Vite.

`npm run check:clerk-env` prints **yes/no only** — never secret values.

## Loading paths (tip)

| Process | How env is loaded |
| --- | --- |
| `npm run check:clerk-env` | Parses root + `artifacts/wayzen` `.env*` + `process.env` |
| `npm run dev:web` | `node --env-file-if-exists=.env` + Vite merges **root and package** `.env*` + bridges `CLERK_PUBLISHABLE_KEY` → client define |
| `npm run dev:api` | `node --env-file-if-exists=.env` + api-server `../../.env`; needs `CLERK_SECRET_KEY` |

You do **not** need a separate `artifacts/wayzen/.env` if root `.env` is correct.
