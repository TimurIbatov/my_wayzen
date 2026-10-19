import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { ClerkProvider, useAuth as useClerkAuth, useClerk as useClerkApi } from '@clerk/react';
import { shadcn } from '@clerk/themes';
import { isClerkConfigured, publishableKeyFromHost } from '@/lib/clerk';
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
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  );
  const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={{
        theme: shadcn,
        cssLayerName: 'clerk',
        options: {
          logoPlacement: 'inside',
          logoLinkUrl: basePath || '/',
          logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
        },
        variables: {
          colorPrimary: '#2dd4bf',
          colorForeground: '#e8eef2',
          colorMutedForeground: '#9aa8b2',
          colorDanger: '#f07167',
          colorBackground: '#121820',
          colorInput: '#1a222c',
          colorInputForeground: '#e8eef2',
          colorNeutral: '#2a3440',
          fontFamily: 'Manrope, sans-serif',
          borderRadius: '0.9rem',
        },
        elements: {
          rootBox: 'w-full flex justify-center',
          cardBox: 'bg-[#121820] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-none border border-[#2a3440]',
          card: '!shadow-none !border-0 !bg-transparent !rounded-none',
          footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
          headerTitle: 'text-[#e8eef2] font-semibold',
          headerSubtitle: 'text-[#9aa8b2]',
          socialButtonsBlockButtonText: 'text-[#e8eef2]',
          formFieldLabel: 'text-[#e8eef2]',
          footerActionLink: 'text-[#2dd4bf]',
          footerActionText: 'text-[#9aa8b2]',
          dividerText: 'text-[#9aa8b2]',
          identityPreviewEditButton: 'text-[#2dd4bf]',
          formFieldSuccessText: 'text-[#2dd4bf]',
          alertText: 'text-[#f07167]',
          logoBox: 'rounded-xl',
          logoImage: 'object-contain',
          socialButtonsBlockButton: 'border-[#2a3440] bg-[#1a222c]',
          formButtonPrimary: 'bg-[#2dd4bf] text-[#0b1218]',
          formFieldInput: 'border-[#2a3440] bg-[#1a222c] text-[#e8eef2]',
          footerAction: 'text-[#9aa8b2]',
          dividerLine: 'bg-[#2a3440]',
          alert: 'bg-[#2a1d22]',
          otpCodeFieldInput: 'border-[#2a3440] bg-[#1a222c] text-[#e8eef2]',
          formFieldRow: 'text-[#e8eef2]',
          main: 'text-[#e8eef2]',
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
