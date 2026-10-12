import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@/lib/clerk';
import { shadcn } from '@clerk/themes';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { useFavoritesState } from '@/hooks/use-favorites';
import { basePath } from '@/lib/constants';
import { AIChat } from '@/pages/ai-chat';
import { AdminPlaces } from '@/pages/admin-places';
import { Catalog } from '@/pages/catalog';
import { Favorites } from '@/pages/favorites';
import { HomeRedirect } from '@/pages/home';
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
  const isAuthPath = currentPath.startsWith('/sign-in') || currentPath.startsWith('/sign-up');
  return <div className="shell">{!isAuthPath && <Header favoriteCount={favorites.values.length} />}
    <Switch>
      <Route path="/" component={HomeRedirect} />
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
      <Route>{() => <NotFound navigate={() => setLocation('/')} signedIn={Boolean(isSignedIn)} />}</Route>
    </Switch>
  </div>;
}

function ClerkRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={{
      theme: shadcn, cssLayerName: 'clerk',
      options: { logoPlacement: 'inside', logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
      variables: { colorPrimary: '#1c6556', colorForeground: '#214f45', colorMutedForeground: '#697970', colorDanger: '#a64d3e', colorBackground: '#faf8ef', colorInput: '#fffdf6', colorInputForeground: '#214f45', colorNeutral: '#d9d8ca', fontFamily: 'DM Sans, sans-serif', borderRadius: '0.85rem' },
      elements: {
        rootBox: 'w-full flex justify-center',
        cardBox: 'bg-[#faf8ef] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-none border border-[#dedccf]',
        card: '!shadow-none !border-0 !bg-transparent !rounded-none',
        footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
        headerTitle: 'text-[#214f45] font-semibold', headerSubtitle: 'text-[#697970]',
        socialButtonsBlockButtonText: 'text-[#214f45]', formFieldLabel: 'text-[#214f45]',
        footerActionLink: 'text-[#1c6556]', footerActionText: 'text-[#697970]', dividerText: 'text-[#697970]',
        identityPreviewEditButton: 'text-[#1c6556]', formFieldSuccessText: 'text-[#286c58]', alertText: 'text-[#8e4437]',
        logoBox: 'rounded-xl', logoImage: 'object-contain', socialButtonsBlockButton: 'border-[#d9d8ca] bg-[#fffdf6]',
        formButtonPrimary: 'bg-[#1c6556] text-[#fff8e8]', formFieldInput: 'border-[#d9d8ca] bg-[#fffdf6] text-[#214f45]',
        footerAction: 'text-[#697970]', dividerLine: 'bg-[#dedccf]', alert: 'bg-[#f7e9e3]',
        otpCodeFieldInput: 'border-[#d9d8ca] bg-[#fffdf6] text-[#214f45]', formFieldRow: 'text-[#214f45]', main: 'text-[#214f45]',
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
    <ClerkCacheInvalidator />
    <SiteRouter />
  </ClerkProvider>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={basePath}><ClerkRoutes /></WouterRouter></QueryClientProvider>;
}

export default App;
