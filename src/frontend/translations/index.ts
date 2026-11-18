import type { LanguageCode } from '../../../backend/types/index.ts';
import { bn } from './bn.ts';
import { en, type TranslationDictionary } from './en.ts';
import { gu } from './gu.ts';
import { hi } from './hi.ts';
import { mr } from './mr.ts';
import { ta } from './ta.ts';
import { te } from './te.ts';

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en,
  hi,
  bn,
  te,
  mr,
  ta,
  gu,
};

export const LANGUAGE_OPTIONS: { code: LanguageCode; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
];

export function getTranslation(lang: LanguageCode): TranslationDictionary {
  return TRANSLATIONS[lang] || en;
}

/**
 * Safe nested key lookup with guaranteed English fallback.
 */
export function tKey(lang: LanguageCode, path: string): string {
  const parts = path.split('.');
  const resolve = (obj: unknown): string | undefined => {
    let curr: unknown = obj;
    for (const part of parts) {
      if (curr && typeof curr === 'object' && part in (curr as Record<string, unknown>)) {
        curr = (curr as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return typeof curr === 'string' ? curr : undefined;
  };
  return resolve(TRANSLATIONS[lang]) ?? resolve(en) ?? path;
}
