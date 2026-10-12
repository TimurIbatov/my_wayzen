import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LOCALES, formatMessage, messages, type Locale } from './messages';

const STORAGE_KEY = 'wayzen-locale';

type I18nContextValue = {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLocale(): Locale {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value && value in messages) return value as Locale;
  } catch { /* ignore */ }
  return 'ru';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => (typeof window === 'undefined' ? 'ru' : readStoredLocale()));
  const meta = LOCALES.find(item => item.id === locale) ?? LOCALES[0];

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = meta.dir;
    document.documentElement.classList.add('dark');
  }, [locale, meta.dir]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    dir: meta.dir,
    setLocale,
    t: (key, vars) => formatMessage(messages[locale][key] ?? messages.en[key] ?? key, vars),
  }), [locale, meta.dir]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within LocaleProvider');
  return ctx;
}
