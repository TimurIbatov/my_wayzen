/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
  readonly NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
  readonly VITE_CLERK_PROXY_URL?: string;
  readonly NEXT_PUBLIC_CLERK_PROXY_URL?: string;
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Injected by Vite define from resolved root/package .env (never log the value). */
declare const __WAYZEN_CLERK_PUBLISHABLE_KEY__: string;
declare const __WAYZEN_CLERK_PROXY_URL__: string;
