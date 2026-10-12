import type { ReactNode } from 'react';

export function EmptyState({ icon, title, copy, action }: { icon: ReactNode; title: string; copy: string; action?: ReactNode }) {
  return <div className="empty" data-testid="empty-state"><div className="empty-icon">{icon}</div><h2>{title}</h2><p>{copy}</p>{action}</div>;
}
