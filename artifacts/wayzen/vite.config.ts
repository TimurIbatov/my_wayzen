import path from 'path';
import { existsSync, readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

const appDir = path.resolve(import.meta.dirname);
/** Monorepo root — primary place for `.env` / Cursor secrets dump. */
const rootDir = path.resolve(appDir, '../..');

function stripEnvValue(raw: string) {
  let v = raw.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (v.charCodeAt(0) === 0xfeff) v = v.slice(1);
  return v.trim();
}

/** Parse a dotenv file manually (handles BOM / odd quoting). */
function parseDotEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};
  const text = readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    out[t.slice(0, eq).trim()] = stripEnvValue(t.slice(eq + 1));
  }
  return out;
}

function mergeClerkEnv(mode: string) {
  // Vite loadEnv (root wins over package) + manual parse as fallback.
  const fromRoot = loadEnv(mode, rootDir, '');
  const fromApp = loadEnv(mode, appDir, '');
  const manual = {
    ...parseDotEnvFile(path.join(appDir, '.env')),
    ...parseDotEnvFile(path.join(appDir, '.env.local')),
    ...parseDotEnvFile(path.join(rootDir, '.env')),
    ...parseDotEnvFile(path.join(rootDir, '.env.local')),
    ...parseDotEnvFile(path.join(rootDir, `.env.${mode}`)),
    ...parseDotEnvFile(path.join(rootDir, `.env.${mode}.local`)),
  };

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const fromProcess = process.env[key]?.trim();
      if (fromProcess) return stripEnvValue(fromProcess);
      const fromManual = manual[key];
      if (fromManual) return fromManual;
      const fromViteRoot = fromRoot[key]?.trim();
      if (fromViteRoot) return stripEnvValue(fromViteRoot);
      const fromViteApp = fromApp[key]?.trim();
      if (fromViteApp) return stripEnvValue(fromViteApp);
    }
    return '';
  };

  const publishable = pick(
    'VITE_CLERK_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_PUBLISHABLE_KEY',
  );
  const proxy = pick('VITE_CLERK_PROXY_URL', 'NEXT_PUBLIC_CLERK_PROXY_URL');

  // So Vite's built-in import.meta.env exposure also sees the bridged values.
  if (publishable) {
    process.env.VITE_CLERK_PUBLISHABLE_KEY = publishable;
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = publishable;
    }
  }
  if (proxy) {
    process.env.VITE_CLERK_PROXY_URL = proxy;
  }

  return { publishable, proxy };
}

function clerkEnvLogPlugin(loaded: boolean): Plugin {
  return {
    name: 'wayzen-clerk-env-log',
    configResolved() {
      // Never log the key value — boolean only.
      console.log(`[wayzen] clerkPublishableKeyLoaded: ${loaded}`);
      if (!loaded) {
        console.log(
          '[wayzen] Tip: put VITE_CLERK_PUBLISHABLE_KEY (or CLERK_PUBLISHABLE_KEY) in repo-root .env, then fully restart Vite. See docs/clerk-env.md / npm run check:clerk-env',
        );
      }
    },
  };
}

export default defineConfig(async ({ mode }) => {
  const { publishable: clerkPublishable, proxy: clerkProxy } = mergeClerkEnv(mode);
  const clerkPublishableKeyLoaded = Boolean(
    clerkPublishable.startsWith('pk_test_') || clerkPublishable.startsWith('pk_live_'),
  );

  return {
    base: basePath,
    // Prefer monorepo root; package-local .env still merged above via loadEnv(appDir).
    envDir: rootDir,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    // Use custom defines — do NOT overwrite import.meta.env.* via define (breaks Vite env).
    define: {
      __WAYZEN_CLERK_PUBLISHABLE_KEY__: JSON.stringify(clerkPublishable),
      __WAYZEN_CLERK_PROXY_URL__: JSON.stringify(clerkProxy),
    },
    plugins: [
      clerkEnvLogPlugin(clerkPublishableKeyLoaded),
      react(),
      tailwindcss(),
      runtimeErrorOverlay(),
      ...(process.env.NODE_ENV !== 'production' &&
      process.env.REPL_ID !== undefined
        ? [
            await import('@replit/vite-plugin-cartographer').then((m) =>
              m.cartographer({
                root: path.resolve(import.meta.dirname, '..'),
              }),
            ),
            await import('@replit/vite-plugin-dev-banner').then((m) =>
              m.devBanner(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        '@assets': path.resolve(
          import.meta.dirname,
          '..',
          '..',
          'attached_assets',
        ),
      },
      dedupe: ['react', 'react-dom'],
    },
    root: appDir,
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist/public'),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
      fs: {
        strict: true,
        // Allow reading monorepo root when tooling needs it.
        allow: [rootDir],
      },
      proxy: {
        '/api': {
          target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:5055',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        '/api': {
          target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:5055',
          changeOrigin: true,
        },
      },
    },
  };
});
