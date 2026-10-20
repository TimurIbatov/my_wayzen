import { Bookmark, Compass, GitBranch, Map as MapIcon, MessageCircle } from 'lucide-react';
import { useAuth, useClerk } from '@/lib/auth';
import { Link, useLocation } from 'wouter';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { basePath } from '@/lib/constants';
import { LOCALES, useI18n } from '@/lib/i18n';

export function AppSidebar({ favoriteCount }: { favoriteCount: number }) {
  const [path] = useLocation();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { t, locale } = useI18n();
  const code = LOCALES.find(item => item.id === locale)?.short ?? 'RU';

  const links = [
    { href: '/ai', label: t('nav.ai'), icon: MessageCircle, test: 'ai' },
    { href: '/map', label: t('nav.map'), icon: MapIcon, test: 'map' },
    { href: '/places', label: t('nav.places'), icon: GitBranch, test: 'places' },
    { href: '/planner', label: t('nav.planner'), icon: Compass, test: 'planner' },
    { href: '/favorites', label: t('nav.favorites'), icon: Bookmark, test: 'favorites', badge: favoriteCount || undefined },
  ] as const;

  const active = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <aside className="wz-sidebar" data-testid="app-sidebar">
      <Link href="/" className="wz-side-logo" aria-label="WayZen" data-testid="link-sidebar-home">
        <span className="wz-side-mark" aria-hidden><Compass size={18} /></span>
      </Link>
      <nav className="wz-side-nav" aria-label={t('nav.aria')}>
        {links.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active(item.href) ? 'active' : ''}
              aria-label={item.label}
              title={item.label}
              data-testid={`nav-${item.test}`}
            >
              <Icon size={18} />
              {'badge' in item && item.badge ? <span className="wz-side-badge">{item.badge}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="wz-side-foot">
        <LanguageSwitcher compact />
        {isSignedIn ? (
          <>
            <Link className="wz-side-textbtn" href="/profile" data-testid="link-profile">{t('nav.profile')}</Link>
            <button className="wz-side-textbtn" type="button" onClick={() => void signOut({ redirectUrl: basePath || '/' })} data-testid="button-sign-out">{t('nav.signOut')}</button>
          </>
        ) : (
          <Link className="wz-side-textbtn" href="/sign-up" data-testid="link-sign-up">{t('nav.signUp')}</Link>
        )}
        <span className="wz-side-brand" data-testid="text-sidebar-brand">{t('brand.side', { code })}</span>
      </div>
    </aside>
  );
}
