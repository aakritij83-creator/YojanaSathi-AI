# Deployment Guide

## Environment Variables (`.env.example`)
- `GEMINI_API_KEY`: Server-side Google Gemini API key for `@google/genai`.
- `APP_URL`: Public application URL.
- `SESSION_SECRET`: 32+ character cryptographic secret for HMAC session tokens (auto-generates `backend/data/.runtime-secret` locally if omitted).
- `ADMIN_EMAIL`: Optional comma-separated email allowlist (default: `admin@yojanasathi.in`) that grants `'admin'` role upon account creation.
- `PORT`: Listening port (defaults to `3000`).

## Build & Start Commands
```bash
npm ci
npm run lint
npm run build
npm test
NODE_ENV=production npm start
```

## Storage & External Firebase Option
By default, the Express server persists records atomically to `backend/data/yojanasathi-db.json` (ensure a persistent volume is mounted at `backend/data` in containerized hosting). If migrating to external Firebase Auth & Cloud Firestore, apply the rules and indexes under `firebase/` as documented in `firebase/configuration/README.md`.
