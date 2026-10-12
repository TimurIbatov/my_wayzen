import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@/lib/clerk';
import { shadcn } from '@clerk/themes';
import { Route, Switch, Router as WouterRouter, useLocation, Redirect } from 'wouter';
import { AppSidebar } from '@/components/AppSidebar';
import { useFavoritesState } from '@/hooks/use-favorites';
import { LocaleProvider, useI18n } from '@/lib/i18n';
import { basePath } from '@/lib/constants';
import { AIChat } from '@/pages/ai-chat';
import { AdminPlaces } from '@/pages/admin-places';
import { Catalog } from '@/pages/catalog';
import { Favorites } from '@/pages/favorites';
import { MapPage } from '@/pages/map';
import { Onboarding } from '@/pages/onboarding';
import { PlaceDetail } from '@/pages/place-detail';
import { Planner } from '@/pages/planner';
import { ProfilePage } from '@/pages/profile';
import { TripDetail } from '@/pages/trip-detail';
import { Trips } from '@/pages/trips';
import { UserPortal } from '@/pages/user-portal';
import { NotFound } from '@/pages/not-found';
import { ProtectedPortalRoute, SignInPage, SignUpPage } from '@/pages/auth';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
const stripBase = (path: string) => basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;

function ClerkCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const lastUser = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => { const id = user?.id ?? null; if (lastUser.current !== undefined && id !== lastUser.current) client.clear(); lastUser.current = id; }), [addListener, client]);
  return null;
}

function SiteRouter() {
  const favorites = useFavoritesState();
  const [currentPath, setLocation] = useLocation();
  const { isSignedIn } = useAuth();
  const { t } = useI18n();
  const isAuthPath = currentPath.startsWith('/sign-in') || currentPath.startsWith('/sign-up');
  return (
    <div className={`shell wz-night${isAuthPath ? ' wz-auth-shell' : ''}`}>
      {!isAuthPath && <AppSidebar favoriteCount={favorites.values.length} />}
      <div className="wz-main">
        <Switch>
          <Route path="/">{() => <Redirect to="/ai" />}</Route>
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/places" component={Catalog} />
          <Route path="/place/:slug" component={PlaceDetail} />
          <Route path="/map" component={MapPage} />
          <Route path="/planner" component={Planner} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/trips" component={Trips} />
          <Route path="/trips/:id">{() => <TripDetail />}</Route>
          <Route path="/ai" component={AIChat} />
          <Route path="/profile">{() => <ProtectedPortalRoute><ProfilePage /></ProtectedPortalRoute>}</Route>
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/user-portal">{() => <ProtectedPortalRoute><UserPortal /></ProtectedPortalRoute>}</Route>
          <Route path="/admin/places">{() => <ProtectedPortalRoute><AdminPlaces /></ProtectedPortalRoute>}</Route>
          <Route>{() => <NotFound navigate={() => setLocation('/ai')} signedIn={Boolean(isSignedIn)} />}</Route>
        </Switch>
      </div>
      <span className="sr-only">{t('footer.copy')}</span>
    </div>
  );
}

function ClerkRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={{
        theme: shadcn,
        cssLayerName: 'clerk',
        options: { logoPlacement: 'inside', logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
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
      routerPush={(to: string) => setLocation(stripBase(to))}
      routerReplace={(to: string) => setLocation(stripBase(to), { replace: true })}
    >
      <LocaleProvider>
        <ClerkCacheInvalidator />
        <SiteRouter />
      </LocaleProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={basePath}>
        <ClerkRoutes />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
