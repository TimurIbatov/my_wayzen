import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter, useLocation, Redirect } from 'wouter';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { AuthShell, useAuth, useClerk } from '@/lib/auth';
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
const stripBase = (path: string) => basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;

function ClerkCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const lastUser = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => { const id = user?.id ?? null; if (lastUser.current !== undefined && id !== lastUser.current) client.clear(); lastUser.current = id; }), [addListener, client]);
  return null;
}

/** Attach Clerk session JWT to API client so requireUserId routes work from the SPA. */
function ClerkAuthTokenBridge() {
  const { getToken, isLoaded } = useAuth();
  useEffect(() => {
    if (!isLoaded) return;
    setAuthTokenGetter(async () => {
      try {
        return (await getToken()) ?? null;
      } catch {
        return null;
      }
    });
    return () => setAuthTokenGetter(null);
  }, [getToken, isLoaded]);
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
    <AuthShell
      routerPush={(to: string) => setLocation(stripBase(to))}
      routerReplace={(to: string) => setLocation(stripBase(to), { replace: true })}
    >
      <LocaleProvider>
        <ClerkCacheInvalidator />
        <ClerkAuthTokenBridge />
        <SiteRouter />
      </LocaleProvider>
    </AuthShell>
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
