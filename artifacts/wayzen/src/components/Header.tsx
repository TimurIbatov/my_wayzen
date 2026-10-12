import { ArrowDown, Compass, Heart, Map as MapIcon, MapPin, MessageCircle, Sparkles } from 'lucide-react';
import { useAuth, useClerk } from '@clerk/react';
import { Link, useLocation } from 'wouter';
import { Brand } from '@/components/Brand';
import { basePath } from '@/lib/constants';

export function Header({ favoriteCount }: { favoriteCount: number }) {
  const [path] = useLocation();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const links = [
    ['/places', 'Места'], ['/map', 'Карта'], ['/planner', 'Планер'], ['/ai', 'AI-гид'],
    ['/trips', 'Поездки'], ['/favorites', `Избранное${favoriteCount ? ` · ${favoriteCount}` : ''}`],
  ];
  return <>
    <header className="topbar">
      <div className="top-inner">
        <Brand />
        <nav className="nav" aria-label="Основная навигация">{links.map(([href, label]) =>
          <Link key={href} href={href} className={path === href || path.startsWith(`${href}/`) ? 'active' : ''} data-testid={`nav-${href.slice(1)}`}>{label}</Link>)}
        </nav>
        <div className="top-actions">
          {isSignedIn ? <>
            <Link className="btn btn-quiet" href="/trips" data-testid="link-trips">Мои поездки</Link>
            <Link className="icon-btn" href="/profile" aria-label="Профиль" data-testid="link-profile"><Compass size={17} /></Link>
            <button className="icon-btn" type="button" onClick={() => void signOut({ redirectUrl: basePath || '/' })} aria-label="Выйти" data-testid="button-sign-out"><ArrowDown size={17} /></button>
          </> : <><Link className="btn btn-quiet" href="/sign-in" data-testid="link-sign-in">Войти</Link><Link className="btn btn-primary" href="/sign-up" data-testid="link-sign-up">Создать аккаунт</Link></>}
        </div>
      </div>
    </header>
    <nav className="mobile-nav" aria-label="Навигация для телефона">{links.filter(([href]) => href !== '/trips').map(([href, label], index) => {
      const Icon = [MapPin, MapIcon, Sparkles, MessageCircle, Heart][index];
      return <Link key={href} href={href} className={path === href || path.startsWith(`${href}/`) ? 'active' : ''} data-testid={`mobile-nav-${href.slice(1)}`}><Icon size={18} /><span>{label.split(' ·')[0]}</span></Link>;
    })}</nav>
  </>;
}
