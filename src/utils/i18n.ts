/**
 * Translation utility for non-React contexts (like Zustand stores)
 * 
 * This provides a simple translation function that reads from localStorage
 * to determine the current locale and returns the appropriate translation.
 */

import ruTranslations from '../locales/ru.json';
import enTranslations from '../locales/en.json';
import sahTranslations from '../locales/sah.json';

type Locale = 'ru' | 'en' | 'sah';

const translationsMap: Record<Locale, Record<string, any>> = {
  ru: ruTranslations,
  en: enTranslations,
  sah: sahTranslations,
};

const LOCALE_STORAGE_KEY = 'sonor-locale';

/**
 * Get a translated string by key path
 * @param key - Dot-separated path to translation (e.g., 'errors.invalidMove')
 * @returns The translated string, or the key itself if not found
 */
export function translate(key: string): string {
  // Get current locale from localStorage
  const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
  const locale: Locale = (storedLocale as Locale) || 'ru';

  const translations = translationsMap[locale];
  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
}

// Alias for shorter usage
export const t = translate;
