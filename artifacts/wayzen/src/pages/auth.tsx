import type { ReactNode } from 'react';
import { SignIn, SignUp, useAuth } from '@clerk/react';
import { Link, Redirect } from 'wouter';
import { Brand } from '@/components/Brand';
import { isClerkConfigured } from '@/lib/clerk';
import { basePath } from '@/lib/constants';
import { useI18n } from '@/lib/i18n';

export function ProtectedPortalRoute({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { t } = useI18n();
  if (!isLoaded) return <main className="wrap load-shell"><div className="skeleton" style={{ height: 190 }} aria-label={t('common.loading')} /></main>;
  return isSignedIn ? <>{children}</> : <Redirect to="/" />;
}

function AuthUnavailable() {
  const { t } = useI18n();
  return (
    <div className="wz-auth-missing" data-testid="status-auth-unavailable" role="alert">
      <h2>{t('auth.missingTitle')}</h2>
      <p>{t('auth.missingCopy')}</p>
      <Link className="btn btn-primary" href="/ai" data-testid="link-auth-home">{t('auth.backHome')}</Link>
    </div>
  );
}

export function AuthScreen({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <main className="auth-wrap wz-auth-night">
      <section className="auth-story">
        <Brand />
        <div>
          <span className="eyebrow" style={{ color: '#7ee0d2' }}>{t('auth.kicker')}</span>
          <h1>{t('auth.title')}</h1>
          <p>{t('auth.lead')}</p>
        </div>
        <span className="eyebrow" style={{ color: '#9bb8b2' }}>{t('auth.stamp')}</span>
      </section>
      <section className="auth-card">{isClerkConfigured() ? children : <AuthUnavailable />}</section>
    </main>
  );
}

export function SignInPage() {
  return (
    <AuthScreen>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </AuthScreen>
  );
}

export function SignUpPage() {
  return (
    <AuthScreen>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </AuthScreen>
  );
}
