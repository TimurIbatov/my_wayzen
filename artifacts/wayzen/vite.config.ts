import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

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
/** Monorepo root — Clerk / DB secrets live in root `.env`, not artifacts/wayzen/.env */
const rootDir = path.resolve(appDir, '../..');

export default defineConfig(async ({ mode }) => {
  // Load root .env* so Cursor/local secrets apply even when cwd is the package.
  const fileEnv = loadEnv(mode, rootDir, '');
  const clerkPublishable =
    process.env.VITE_CLERK_PUBLISHABLE_KEY?.trim() ||
    fileEnv.VITE_CLERK_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
    fileEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
    process.env.CLERK_PUBLISHABLE_KEY?.trim() ||
    fileEnv.CLERK_PUBLISHABLE_KEY?.trim() ||
    '';
  const clerkProxy =
    process.env.VITE_CLERK_PROXY_URL?.trim() ||
    fileEnv.VITE_CLERK_PROXY_URL?.trim() ||
    process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim() ||
    fileEnv.NEXT_PUBLIC_CLERK_PROXY_URL?.trim() ||
    '';

  // Bridge non-VITE names into the client bundle (Vite only auto-exposes VITE_/envPrefix).
  if (clerkPublishable && !process.env.VITE_CLERK_PUBLISHABLE_KEY) {
    process.env.VITE_CLERK_PUBLISHABLE_KEY = clerkPublishable;
  }
  if (clerkProxy && !process.env.VITE_CLERK_PROXY_URL) {
    process.env.VITE_CLERK_PROXY_URL = clerkProxy;
  }

  return {
    base: basePath,
    // Critical: read repo-root `.env` / `.env.local` (not only artifacts/wayzen/.env).
    envDir: rootDir,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(clerkPublishable),
      'import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': JSON.stringify(
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
          fileEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
          clerkPublishable,
      ),
      'import.meta.env.VITE_CLERK_PROXY_URL': JSON.stringify(clerkProxy),
      'import.meta.env.NEXT_PUBLIC_CLERK_PROXY_URL': JSON.stringify(
        process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim() ||
          fileEnv.NEXT_PUBLIC_CLERK_PROXY_URL?.trim() ||
          clerkProxy,
      ),
    },
    plugins: [
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
      },
      // Local npm: frontend (5173) and API (5055) are separate processes.
      // Proxy /api so the SPA can call relative /api/* without CORS/base URL setup.
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
