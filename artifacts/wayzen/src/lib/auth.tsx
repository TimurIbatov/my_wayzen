import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { ClerkProvider, useAuth as useClerkAuth, useClerk as useClerkApi } from '@clerk/react';
import {
  isClerkConfigured,
  publishableKeyFromHost,
  resolveClerkProxyUrl,
  resolveClerkPublishableKey,
} from '@/lib/clerk';
import { basePath } from '@/lib/constants';

type AuthValue = {
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken: () => Promise<string | null>;
  signOut: (opts?: { redirectUrl?: string }) => Promise<void>;
  addListener: (cb: (payload: { user: { id?: string } | null | undefined }) => void) => () => void;
};

const guestAuth: AuthValue = {
  isLoaded: true,
  isSignedIn: false,
  getToken: async () => null,
  signOut: async () => undefined,
  addListener: () => () => undefined,
};

const AuthContext = createContext<AuthValue>(guestAuth);

function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { signOut, addListener } = useClerkApi();
  const value = useMemo<AuthValue>(
    () => ({
      isLoaded,
      isSignedIn: Boolean(isSignedIn),
      getToken: async () => {
        try {
          return (await getToken()) ?? null;
        } catch {
          return null;
        }
      },
      signOut: async (opts) => {
        await signOut(opts);
      },
      addListener: (cb) => addListener(cb as never),
    }),
    [addListener, getToken, isLoaded, isSignedIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Drop-in for @clerk/react useAuth (guest-safe when Clerk env is missing). */
export function useAuth() {
  const { isLoaded, isSignedIn, getToken } = useContext(AuthContext);
  return { isLoaded, isSignedIn, getToken };
}

/** Drop-in for @clerk/react useClerk (guest-safe when Clerk env is missing). */
export function useClerk() {
  const { signOut, addListener } = useContext(AuthContext);
  return { signOut, addListener };
}

type AuthShellProps = {
  children: ReactNode;
  routerPush: (to: string) => void;
  routerReplace: (to: string) => void;
};

/**
 * Mount ClerkProvider only when a real publishable key is configured.
 * Host-key synthesis (clerk.127.0.0.1) crashes local npm preview without secrets.
 */
export function AuthShell({ children, routerPush, routerReplace }: AuthShellProps) {
  if (!isClerkConfigured()) {
    return <AuthContext.Provider value={guestAuth}>{children}</AuthContext.Provider>;
  }

  const clerkPubKey = publishableKeyFromHost(
    window.location.hostname,
    resolveClerkPublishableKey(
      import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
      import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    ),
  );
  // resolveClerkProxyUrl already considers Vite define + VITE_/NEXT_PUBLIC_ aliases.
  const clerkProxyUrl = resolveClerkProxyUrl();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      // Page-level SignIn/SignUp set the dark Netlify appearance.
      // Keep provider lean so shadcn/light defaults do not fight the shell.
      appearance={{
        cssLayerName: 'clerk',
        options: {
          logoLinkUrl: basePath || '/',
        },
        variables: {
          colorPrimary: '#2dd4bf',
          colorForeground: '#e8eef2',
          colorMutedForeground: '#94a3b8',
          colorDanger: '#f07167',
          colorBackground: 'transparent',
          colorInput: '#121820',
          colorInputForeground: '#e8eef2',
          colorNeutral: '#334155',
          fontFamily: 'Outfit, system-ui, sans-serif',
          borderRadius: '0.9rem',
        },
      }}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'С возвращением', subtitle: 'Продолжите планировать в своём темпе' } },
        signUp: { start: { title: 'Создайте аккаунт', subtitle: 'Сохраняйте места и собственные поездки' } },
      }}
      routerPush={routerPush}
      routerReplace={routerReplace}
    >
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}
