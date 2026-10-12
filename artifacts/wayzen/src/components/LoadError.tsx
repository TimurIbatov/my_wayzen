import { showErrorText } from '@/lib/errors';

export function LoadError({ onRetry, error }: { onRetry: () => void; error: unknown }) {
  return <div className="error-card" role="alert" data-testid="status-load-error"><span>{showErrorText(error)}</span><button className="btn btn-quiet" onClick={onRetry} data-testid="button-retry">Попробовать снова</button></div>;
}
