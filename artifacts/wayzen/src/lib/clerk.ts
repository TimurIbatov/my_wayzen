/**
 * Resolve Clerk publishable key for the current host.
 * Mirrors @clerk/shared/keys publishableKeyFromHost so auth keeps working after
 * @clerk/react no longer re-exports this helper from `@clerk/react/internal`.
 */

function decodeClerkFrontendApi(key: string) {
  try {
    const raw = key.replace(/^pk_(test|live)_/, '');
    const padded = raw + '='.repeat((4 - (raw.length % 4)) % 4);
    return atob(padded);
  } catch {
    return '';
  }
}

function usablePublishableKey(key?: string) {
  const value = key?.trim();
  if (!(value?.startsWith('pk_test_') || value?.startsWith('pk_live_'))) return undefined;
  const frontendApi = decodeClerkFrontendApi(value);
  // Local preview stub keys (e.g. preview-wayzen.example$) cannot load Clerk widgets.
  if (!frontendApi || frontendApi.includes('example') || frontendApi.startsWith('preview-')) return undefined;
  return value;
}

const envKey = () => usablePublishableKey(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

/** True only when a real publishable key is provided via env (not host/preview synthesis). */
export function isClerkConfigured() {
  return Boolean(envKey());
}

export function publishableKeyFromHost(host: string, fallbackKey?: string): string {
  const fromEnv = usablePublishableKey(fallbackKey) ?? envKey();
  if (fromEnv) return fromEnv;
  const hostname = host.toLowerCase().replace(/:\d+$/, '');
  if (!hostname) throw new Error('Host must not be empty.');
  const encoded = btoa(`clerk.${hostname}$`).replace(/=+$/, '');
  return `pk_live_${encoded}`;
}
