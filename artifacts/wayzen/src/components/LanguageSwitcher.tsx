import { useEffect, useRef, useState } from 'react';
import { Languages } from 'lucide-react';
import { LOCALES, useI18n } from '@/lib/i18n';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = LOCALES.find(item => item.id === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`wz-lang${compact ? ' wz-lang-compact' : ''}`} ref={root}>
      <button
        type="button"
        className="wz-lang-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('lang.open')}
        data-testid="button-language"
        onClick={() => setOpen(value => !value)}
      >
        <Languages size={compact ? 16 : 15} />
        <span>{current.short}</span>
      </button>
      {open && (
        <ul className="wz-lang-menu" role="listbox" aria-label={t('lang.label')} data-testid="menu-language">
          {LOCALES.map(item => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={item.id === locale}
                className={item.id === locale ? 'active' : ''}
                data-testid={`button-language-${item.id}`}
                onClick={() => { setLocale(item.id); setOpen(false); }}
              >
                <strong>{item.short}</strong>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
