import { useContext } from 'react';
import { BaratonaContext } from '@/contexts/BaratonaContext';
import { pt } from './pt';
import { en } from './en';

export { pt, en };
export type { I18nKey } from './pt';

const translations = { pt, en } as const;

/** Returns the translation object for the active language from BaratonaContext. */
export function useI18n() {
  const ctx = useContext(BaratonaContext);
  const lang = ctx?.language ?? 'pt';
  return translations[lang] ?? translations.pt;
}
