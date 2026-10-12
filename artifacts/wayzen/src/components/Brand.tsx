import { Compass } from 'lucide-react';
import { Link } from 'wouter';

export function Brand() {
  return <Link href="/" className="brand" aria-label="WayZen — на главную" data-testid="link-brand">
    <span className="brand-mark"><Compass size={19} /></span><span>wayzen</span>
  </Link>;
}
