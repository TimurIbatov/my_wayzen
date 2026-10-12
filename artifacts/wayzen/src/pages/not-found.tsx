import { ArrowRight, CircleHelp } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export function NotFound({ navigate, signedIn }: { navigate: () => void; signedIn: boolean }) {
  return <main className="wrap load-shell"><EmptyState icon={<CircleHelp size={22} />} title="Такой страницы нет" copy="Попробуйте вернуться к атласу или личному порталу." action={<button className="btn btn-primary" onClick={navigate} data-testid="button-not-found-home">{signedIn ? 'В личный портал' : 'На главную'} <ArrowRight size={15} /></button>} /></main>;
}

export default NotFound;
