import { MapPin } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function ArchiveNotice({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="notice" role="note" data-testid="notice-preliminary-archive">
      <MapPin size={18} />
      <span>{compact ? t('notice.compact') : t('notice.full')}</span>
    </div>
  );
}
