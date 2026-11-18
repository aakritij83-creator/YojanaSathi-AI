# Express API Documentation

All API routes are served from `server.ts` under `/api/*`. Authenticated routes accept either the HTTP-only `ys_session` cookie or `Authorization: Bearer <token>`.

## Health & Export
- `GET /api/health` — Returns `{ status, service, geminiConfigured, timestamp }`.
- `GET /api/export/zip` — Downloads `YojanaSathi-AI.zip` when packaged on disk (404 otherwise).

## Authentication (`/api/auth/*`)
- `POST /api/auth/register` — Creates citizen account (`role` always `'citizen'` unless email matches configured `ADMIN_EMAIL`), sets session cookie, returns `{ token, user }`. Rejects duplicate emails with `409`.
- `POST /api/auth/login` — Verifies `scrypt` password hash, sets session cookie, returns `{ token, user }`.
- `POST /api/auth/logout` — Clears `ys_session` cookie.
- `GET /api/auth/me` — Returns `{ user }` for valid session (`401` if unauthenticated).
- `POST /api/auth/forgot-password` — Generates a 15-minute reset code.
- `POST /api/auth/reset-password` — Verifies reset token and updates password.
- `DELETE /api/auth/account` — Permanently deletes the user and all owned records.

## Profile & Data Controls (`/api/profile/*`)
- `GET /api/profile` — Returns profile and `computeProfileCompletion` score.
- `PUT /api/profile` — Updates optional 14-field Beneficiary Profile, language, and theme preferences.
- `PATCH /api/profile/preferences` — Updates `preferredLanguage` and `themePreference`.
- `GET /api/profile/export-data` — Downloads full user JSON archive.
- `DELETE /api/profile/personal-records` — Clears saved schemes, applications, chats, rejection analyses, and reminders while keeping the account.

## Schemes & Deterministic Eligibility (`/api/schemes/*`)
- `GET /api/schemes` — Supports `q`, `state`, `category`, `classification`, `beneficiary`, `education`, `incomeMax`, `availability`, `eligibility`, `sort`, `page`, `pageSize`. Evaluates eligibility when authenticated.
- `GET /api/schemes/:id` — Returns full verified scheme details and records `recentlyViewedSchemeIds`.
- `POST /api/schemes/eligibility/evaluate` (also `POST /api/eligibility/evaluate`) — Evaluates a provided profile or saved user profile deterministically (`Likely Eligible`, `Potentially Eligible`, `Not Currently Eligible`).

## Saved Schemes, Applications & Dashboard (`/api/*`)
- `GET /api/saved-schemes`, `POST /api/saved-schemes`, `DELETE /api/saved-schemes/:schemeId`
- `GET /api/applications`, `POST /api/applications`, `PATCH /api/applications/:id`, `DELETE /api/applications/:id`
- `GET /api/dashboard` — Returns real persisted counts, profile completion, recommendations, deadlines, pending actions, and Recharts datasets.

## Notifications & Reminders (`/api/*`)
- `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all`, `PATCH /api/notifications/preferences`
- `GET /api/reminders`, `POST /api/reminders`, `PATCH /api/reminders/:id`, `DELETE /api/reminders/:id`

## AI Assistant & Rejection Analyzer (`/api/ai/*`, Rate-Limited)
- `GET /api/ai/conversations`, `POST /api/ai/conversations`, `GET /api/ai/conversations/:id/messages`, `DELETE /api/ai/conversations/:id`
- `POST /api/ai/chat` — Server-side grounded Gemini assistant response with scheme citations.
- `GET /api/ai/rejection-analyses`, `DELETE /api/ai/rejection-analyses/:id`
- `POST /api/ai/analyze-rejection` — Accepts `multipart/form-data` (`file`: PDF/PNG/JPG/WEBP <= 5MB verified by magic bytes, or `rawText` >= 10 chars).

## Feedback & Admin Console (`/api/*`)
- `POST /api/feedback` — Submits citizen feedback.
- `GET /api/admin/overview`, `GET /api/admin/schemes`, `POST /api/admin/schemes`, `PUT /api/admin/schemes/:id`, `POST /api/admin/schemes/:id/archive`, `GET /api/admin/feedback`, `PATCH /api/admin/feedback/:id`, `GET /api/admin/audit-logs` — All strictly protected by `requireAuth` + `requireAdmin` (`403` for non-admin users).
