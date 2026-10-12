import type { ReactNode } from 'react';
import { SignIn, SignUp, useAuth } from '@clerk/react';
import { Redirect } from 'wouter';
import { Brand } from '@/components/Brand';
import { basePath } from '@/lib/constants';

export function ProtectedPortalRoute({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <main className="wrap load-shell"><div className="skeleton" style={{ height: 190 }} /></main>;
  return isSignedIn ? <>{children}</> : <Redirect to="/" />;
}

export function AuthScreen({ children }: { children: ReactNode }) {
  return <main className="auth-wrap"><section className="auth-story"><Brand /><div><span className="eyebrow" style={{ color: '#e7c791' }}>WayZen · Uzbekistan</span><h1>Travel at your own pace.</h1><p>Start with an honest archive of places and shape your own independent journey.</p></div><span className="eyebrow" style={{ color: '#d9e6d7' }}>PRELIMINARY PLACES · SELF-GUIDED IDEAS</span></section><section className="auth-card">{children}</section></main>;
}

export function SignInPage() {
  return <AuthScreen><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></AuthScreen>;
}

export function SignUpPage() {
  return <AuthScreen><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></AuthScreen>;
}
