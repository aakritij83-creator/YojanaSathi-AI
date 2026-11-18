import type { AuthenticatedRequest } from '../middleware/auth.ts';
import type { LanguageCode } from '../types/index.ts';

const VALID_LANGS: ReadonlySet<string> = new Set(['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu']);

export function normalizeLanguageCode(raw: unknown): LanguageCode {
  if (typeof raw === 'string') {
    const clean = raw.trim().toLowerCase();
    if (VALID_LANGS.has(clean)) {
      return clean as LanguageCode;
    }
  }
  return 'en';
}

export function getRequestLanguage(req: AuthenticatedRequest): LanguageCode {
  const fromQuery = typeof req.query?.lang === 'string' ? req.query.lang : '';
  if (VALID_LANGS.has(fromQuery.trim().toLowerCase())) {
    return fromQuery.trim().toLowerCase() as LanguageCode;
  }

  const fromBody =
    req.body && typeof req.body === 'object' && typeof (req.body as { language?: unknown }).language === 'string'
      ? (req.body as { language: string }).language
      : '';
  if (VALID_LANGS.has(fromBody.trim().toLowerCase())) {
    return fromBody.trim().toLowerCase() as LanguageCode;
  }

  const headerVal = req.headers?.['x-language'];
  const fromHeader = Array.isArray(headerVal) ? headerVal[0] : headerVal || '';
  if (VALID_LANGS.has(fromHeader.trim().toLowerCase())) {
    return fromHeader.trim().toLowerCase() as LanguageCode;
  }

  if (req.authUser?.preferredLanguage && VALID_LANGS.has(req.authUser.preferredLanguage)) {
    return req.authUser.preferredLanguage;
  }

  return 'en';
}
