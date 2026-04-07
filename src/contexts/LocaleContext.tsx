import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Locale = 'ru' | 'en' | 'sah';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translations: Record<string, any>;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'sonor-locale';

// Import translation files
import ruTranslations from '../locales/ru.json';
import enTranslations from '../locales/en.json';
import sahTranslations from '../locales/sah.json';

const translationsMap: Record<Locale, Record<string, any>> = {
  ru: ruTranslations,
  en: enTranslations,
  sah: sahTranslations,
};

export const LocaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load locale from localStorage or default to Russian
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return (stored as Locale) || 'ru';
  });

  const [translations, setTranslations] = useState<Record<string, any>>(
    translationsMap[locale]
  );

  // Update translations and persist locale when it changes
  useEffect(() => {
    setTranslations(translationsMap[locale]);
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, translations }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
