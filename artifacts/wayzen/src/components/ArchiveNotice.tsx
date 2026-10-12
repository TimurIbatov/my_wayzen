import { ShieldAlert } from 'lucide-react';

export function ArchiveNotice({ compact = false }: { compact?: boolean }) {
  return <div className="notice" role="note" data-testid="notice-preliminary-archive">
    <ShieldAlert size={18} />
    <span>{compact
      ? 'WayZen’s imported archive contains 16 preliminary records. None is verified yet. Confirm access and current conditions with reliable local sources before setting out.'
      : 'WayZen’s 16 imported archive locations are preliminary, not verified. This is a starting point for independent research—not a current guide. Opening hours, prices, safety, access and exact journey times are not confirmed here; check with reliable local sources before travelling.'}</span>
  </div>;
}
