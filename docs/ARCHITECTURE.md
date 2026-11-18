# System Architecture

## Overview
YojanaSathi AI runs as a unified full-stack TypeScript web application served from `server.ts` on port `3000`:
- **Development**: Express mounts `vite.middlewares` in SPA mode so frontend HMR-free bundling and `/api/*` endpoints share a single origin.
- **Production**: `npm run build` outputs the compiled React client to `dist/`, and Express serves static assets plus SPA fallback alongside `/api/*`.

## Layer Breakdown
1. **Frontend (`src/frontend/`)**:
   - React 19 + React Router v7 + Tailwind CSS v4 (`@custom-variant dark`).
   - React Hook Form + Zod for client form validation.
   - Recharts for personalized dashboard distributions (strictly derived from real backend counts).
   - Context providers: `ThemeContext`, `LanguageContext` (7 languages), `AuthContext`.
2. **Backend API (`backend/`)**:
   - `routes/authRoutes.ts`: Registration, login, logout, password reset, account deletion.
   - `routes/profileRoutes.ts`: 14-field profile CRUD, completion calculator, DPDP export & wipe.
   - `routes/schemeRoutes.ts`: Directory search/filter/sort/pagination, view tracking, deterministic evaluation endpoint.
   - `routes/applicationRoutes.ts`: Bookmarks, self-reported tracker (9 statuses + history), dashboard aggregation.
   - `routes/notificationRoutes.ts`: Alerts, preferences, personal reminders.
   - `routes/aiRoutes.ts`: Rate-limited Gemini chat & `multer` 5MB multimodal rejection notice analysis.
   - `routes/adminRoutes.ts`: Feedback ingestion & RBAC-protected scheme/feedback/audit console.
3. **Deterministic Eligibility Engine (`backend/services/eligibilityEngine.ts`)**:
   - Pure functional rules engine with zero LLM dependency.
4. **AI Proxy Layer (`backend/ai/geminiService.ts`)**:
   - Server-side `@google/genai` SDK (`gemini-4-hydrogen`), passing grounded active scheme data and structured JSON output schemas.
