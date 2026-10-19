import { useEffect, useState, type ReactNode } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import { useAuth } from '@/lib/auth';
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

function AuthUnavailable({ reason }: { reason?: 'missing' | 'failed' }) {
  const { t } = useI18n();
  return (
    <div className="wz-auth-missing" data-testid="status-auth-unavailable" role="alert">
      <span className="wz-kicker">Clerk</span>
      <h2>{t('auth.missingTitle')}</h2>
      <p>{reason === 'failed' ? t('auth.failedCopy') : t('auth.missingCopy')}</p>
      <code>VITE_CLERK_PUBLISHABLE_KEY=pk_test_…</code>
      <Link className="btn btn-primary" href="/ai" data-testid="link-auth-home">{t('auth.backHome')}</Link>
    </div>
  );
}

function ClerkAuthSlot({ children }: { children: ReactNode }) {
  const { isLoaded } = useAuth();
  const { t } = useI18n();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isClerkConfigured()) return;
    const timer = window.setTimeout(() => {
      const mounted = document.querySelector('.auth-card .cl-rootBox, .auth-card .cl-cardBox, .auth-card .cl-card');
      if (!mounted) setTimedOut(true);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!isClerkConfigured()) return <AuthUnavailable reason="missing" />;
  if (timedOut) return <AuthUnavailable reason="failed" />;
  if (!isLoaded) {
    return (
      <div className="wz-auth-missing" data-testid="status-auth-loading" aria-busy="true">
        <span className="wz-kicker">Clerk</span>
        <h2>{t('common.loading')}</h2>
        <div className="skeleton" style={{ height: 120, borderRadius: 14 }} />
      </div>
    );
  }
  return <>{children}</>;
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
      <section className="auth-card">
        <ClerkAuthSlot>{children}</ClerkAuthSlot>
      </section>
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
