import { useEffect, useState } from 'react';

export const safeRead = <T,>(key: string, fallback: T): T => {
  try { const parsed = localStorage.getItem(key); return parsed ? JSON.parse(parsed) as T : fallback; } catch { return fallback; }
};
export const saveLocal = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Browser storage may be unavailable. */ } };

export function useLocalSet(key: string) {
  const [values, setValues] = useState<string[]>(() => safeRead(key, []));
  useEffect(() => saveLocal(key, values), [key, values]);
  const toggle = (value: string) => setValues(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  return { values, setValues, toggle };
}

export function getAnonymousId() {
  const key = 'wayzen-anonymous-id';
  let id = safeRead<string>(key, '');
  if (!id) { id = `guest-${crypto.randomUUID()}`; saveLocal(key, id); }
  return id;
}
