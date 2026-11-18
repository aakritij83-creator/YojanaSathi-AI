import React, { createContext, useContext, useEffect, useState } from 'react';
import type { GovernmentScheme, LanguageCode } from '../../../backend/types/index.ts';
import { getTranslation, tKey } from '../translations/index.ts';
import { localizeScheme as localizeSchemeForLang } from '../translations/domainLabels.ts';
import type { TranslationDictionary } from '../translations/en.ts';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationDictionary;
  tr: (path: string) => string;
  localizeScheme: (scheme: GovernmentScheme) => GovernmentScheme;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const LANG_STORAGE_KEY = 'ys_preferred_language';
const VALID_LANGS: LanguageCode[] = ['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu'];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY) as LanguageCode | null;
      if (saved && VALID_LANGS.includes(saved)) return saved;
    } catch {
      // ignore
    }
    return 'en';
  });

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      // ignore
    }
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    if (VALID_LANGS.includes(lang)) {
      setLanguageState(lang);
    }
  };

  const t = getTranslation(language);
  const tr = (path: string) => tKey(language, path);
  const localizeScheme = (scheme: GovernmentScheme) => localizeSchemeForLang(scheme, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tr, localizeScheme }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
