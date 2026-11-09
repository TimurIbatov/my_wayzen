import { useEffect, useState, type ReactNode } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import { useAuth } from '@/lib/auth';
import { Link, Redirect } from 'wouter';
import { isClerkConfigured } from '@/lib/clerk';
import { basePath } from '@/lib/constants';
import { useI18n } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function ProtectedPortalRoute({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { t } = useI18n();
  if (!isLoaded) {
    return (
      <main className="wrap load-shell">
        <div className="skeleton" style={{ height: 190 }} aria-label={t('common.loading')} />
      </main>
    );
  }
  return isSignedIn ? <>{children}</> : <Redirect to="/" />;
}

function AuthUnavailable({ reason }: { reason?: 'missing' | 'failed' }) {
  const { t } = useI18n();
  return (
    <div className="wz-auth-missing" data-testid="status-auth-unavailable" role="alert">
      <span className="wz-kicker">Clerk</span>
      <h2>{t('auth.missingTitle')}</h2>
      <p>{reason === 'failed' ? t('auth.failedCopy') : t('auth.missingCopy')}</p>
      <code>
        VITE_CLERK_PUBLISHABLE_KEY (or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) in repo-root .env — then
        restart dev:web / dev:api
      </code>
      <Link className="wz-cta-primary" href="/ai" data-testid="link-auth-home">
        {t('auth.backHome')}
      </Link>
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
      const mounted = document.querySelector(
        '.wz-auth-clerk .cl-rootBox, .wz-auth-clerk .cl-cardBox, .wz-auth-clerk .cl-card',
      );
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
    <main className="wz-auth-page" data-testid="page-auth">
      <div className="wz-landing-glow wz-landing-glow-top" aria-hidden />
      <div className="wz-landing-glow wz-landing-glow-teal" aria-hidden />
      <div className="wz-landing-glow wz-landing-glow-purple" aria-hidden />
      <div className="wz-landing-grain" aria-hidden />

      <div className="wz-landing-lang">
        <LanguageSwitcher />
      </div>

      <div className="wz-auth-center">
        <header className="wz-auth-hero">
          <Link href="/" className="wz-auth-brand" data-testid="link-auth-brand">
            {t('landing.brand')}
          </Link>
          <p className="wz-auth-tagline">{t('auth.kicker')}</p>
          <h1 className="wz-auth-title">{t('auth.title')}</h1>
          <p className="wz-auth-lead">{t('auth.lead')}</p>
        </header>

        <section className="wz-auth-panel">
          <div className="wz-auth-clerk">
            <ClerkAuthSlot>{children}</ClerkAuthSlot>
          </div>
          <p className="wz-auth-stamp">{t('auth.stamp')}</p>
        </section>
      </div>
    </main>
  );
}

const clerkAppearance = {
  variables: {
    colorPrimary: '#2dd4bf',
    colorForeground: '#e8eef2',
    colorMutedForeground: '#94a3b8',
    colorDanger: '#f07167',
    colorBackground: 'transparent',
    colorInput: '#121820',
    colorInputForeground: '#e8eef2',
    colorNeutral: '#334155',
    colorTextOnPrimaryBackground: '#0b1220',
    fontFamily: 'Outfit, system-ui, sans-serif',
    fontFamilyButtons: 'Outfit, system-ui, sans-serif',
    borderRadius: '0.9rem',
  },
  elements: {
    rootBox: 'wz-cl-root',
    cardBox: 'wz-cl-cardBox',
    card: 'wz-cl-card',
    headerTitle: 'wz-cl-title',
    headerSubtitle: 'wz-cl-subtitle',
    socialButtonsBlockButton: 'wz-cl-social',
    socialButtonsBlockButtonText: 'wz-cl-social-text',
    dividerLine: 'wz-cl-divider',
    dividerText: 'wz-cl-muted',
    formFieldLabel: 'wz-cl-label',
    formFieldInput: 'wz-cl-input',
    formButtonPrimary: 'wz-cl-primary',
    footer: 'wz-cl-footer',
    footerAction: 'wz-cl-footer-action',
    footerActionText: 'wz-cl-muted',
    footerActionLink: 'wz-cl-link',
    identityPreviewEditButton: 'wz-cl-link',
    formFieldSuccessText: 'wz-cl-link',
    alert: 'wz-cl-alert',
    alertText: 'wz-cl-alert-text',
    otpCodeFieldInput: 'wz-cl-input',
  },
} as const;

export function SignInPage() {
  return (
    <AuthScreen>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={clerkAppearance}
      />
    </AuthScreen>
  );
}

export function SignUpPage() {
  return (
    <AuthScreen>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={clerkAppearance}
      />
    </AuthScreen>
  );
}
