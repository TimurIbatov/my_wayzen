/**
 * Resolve Clerk publishable key for the current host.
 * Mirrors @clerk/shared/keys publishableKeyFromHost so auth keeps working after
 * @clerk/react no longer re-exports this helper from `@clerk/react/internal`.
 */
export function publishableKeyFromHost(host: string, fallbackKey?: string): string {
  if (fallbackKey?.startsWith('pk_test_')) return fallbackKey;
  const hostname = host.toLowerCase().replace(/:\d+$/, '');
  if (!hostname) throw new Error('Host must not be empty.');
  const encoded = btoa(`clerk.${hostname}$`).replace(/=+$/, '');
  return `pk_live_${encoded}`;
}
