import { useLocale } from '../contexts/LocaleContext';

/**
 * Hook for accessing translations
 * @returns A function to get translated strings by key path
 * 
 * @example
 * const t = useTranslation();
 * t('gameMode.title') // Returns "Режим игры" in Russian
 * t('errors.invalidMove') // Returns "Неверный ход" in Russian
 */
export const useTranslation = () => {
  const { translations } = useLocale();

  /**
   * Get a translated string by key path
   * @param key - Dot-separated path to translation (e.g., 'gameMode.title')
   * @returns The translated string, or the key itself if not found
   */
  const t = (key: string): string => {
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
  };

  return t;
};
