/**
 * Resolve Clerk publishable key for the current host.
 * Mirrors @clerk/shared/keys publishableKeyFromHost so auth keeps working after
 * @clerk/react no longer re-exports this helper from `@clerk/react/internal`.
 */

const envKey = () => {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();
  if (key?.startsWith('pk_test_') || key?.startsWith('pk_live_')) return key;
  return undefined;
};

/** True only when a real publishable key is provided via env (not host synthesis). */
export function isClerkConfigured() {
  return Boolean(envKey());
}

export function publishableKeyFromHost(host: string, fallbackKey?: string): string {
  const fromEnv = fallbackKey?.startsWith('pk_test_') || fallbackKey?.startsWith('pk_live_')
    ? fallbackKey
    : envKey();
  if (fromEnv) return fromEnv;
  const hostname = host.toLowerCase().replace(/:\d+$/, '');
  if (!hostname) throw new Error('Host must not be empty.');
  const encoded = btoa(`clerk.${hostname}$`).replace(/=+$/, '');
  return `pk_live_${encoded}`;
}
