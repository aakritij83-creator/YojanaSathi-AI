# 7-Language Localization System

YojanaSathi AI supports **7 Indian languages** across UI copy, navigation, authentication, profile forms, eligibility labels, and Gemini AI guidance:

1. English (`en`) — Default
2. Hindi (`hi` — हिन्दी)
3. Bengali (`bn` — বাংলা)
4. Telugu (`te` — తెలుగు)
5. Marathi (`mr` — मराठी)
6. Tamil (`ta` — தமிழ்)
7. Gujarati (`gu` — ગુજરાતી)

## Implementation Details
- Dictionaries live in `src/frontend/translations/{en,hi,bn,te,mr,ta,gu}.ts`.
- `LanguageContext` persists the active code in `localStorage` (`ys_lang`) and syncs `preferredLanguage` to the authenticated user account (`PATCH /api/profile/preferences`).
- `tKey(lang, path)` guarantees automatic fallback to English if a key path is ever missing.
- `index.html` loads Google Fonts for `Noto Sans` plus Devanagari, Bengali, Telugu, Tamil, and Gujarati scripts so all 7 languages render cleanly without missing glyphs.
- `tests/security-and-localization.test.ts` verifies 100% key parity across all 7 translation dictionaries.
