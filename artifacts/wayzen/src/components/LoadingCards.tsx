export function LoadingCards({ count = 6 }: { count?: number }) {
  return <div className="results-grid" role="status" aria-label="Загружаем места" data-testid="status-places-loading">{Array.from({ length: count }, (_, i) =>
    <div className="sk-card" key={i}><div className="skeleton sk-line" /><div className="skeleton sk-line short" /></div>)}</div>;
}
