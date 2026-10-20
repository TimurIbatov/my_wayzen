import { Compass } from 'lucide-react';
import { Link } from 'wouter';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n';

export function Landing() {
  const { t } = useI18n();

  return (
    <main className="wz-landing" data-testid="page-landing">
      <div className="wz-landing-glow wz-landing-glow-top" aria-hidden />
      <div className="wz-landing-glow wz-landing-glow-teal" aria-hidden />
      <div className="wz-landing-glow wz-landing-glow-purple" aria-hidden />
      <div className="wz-landing-grain" aria-hidden />

      <div className="wz-landing-lang">
        <LanguageSwitcher />
      </div>

      <div className="wz-landing-center">
        <div className="wz-landing-hero">
          <h1 className="wz-landing-brand" data-testid="text-landing-brand">{t('landing.brand')}</h1>
          <p className="wz-landing-tagline" data-testid="text-landing-tagline">{t('landing.tagline')}</p>
          <h2 className="wz-landing-title" data-testid="text-landing-title">
            <span>{t('landing.titleLine1')}</span>
            <span>{t('landing.titleLine2')}</span>
          </h2>
          <p className="wz-landing-lead" data-testid="text-landing-lead">{t('landing.lead')}</p>
          <div className="wz-landing-actions">
            <Link className="wz-cta-primary" href="/ai" data-testid="link-start-journey">
              <Compass size={20} aria-hidden />
              {t('landing.ctaStart')}
            </Link>
            <Link className="wz-cta-outline" href="/sign-in" data-testid="link-landing-sign-in">
              {t('landing.ctaSignIn')}
            </Link>
          </div>
        </div>
      </div>

      <footer className="wz-landing-foot" data-testid="text-landing-footer">
        <p>{t('landing.footer')}</p>
      </footer>
    </main>
  );
}
