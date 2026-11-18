# YojanaSathi AI — Your Intelligent Guide to Government Schemes

**Tagline:** *The Right Scheme. The Right Guidance. The Right Opportunity.*

YojanaSathi AI is a full-stack public civic-tech platform that helps Indian citizens discover relevant Central and State government schemes, verify eligibility through a transparent deterministic backend engine, prepare official application documents, track self-reported application progress, understand rejection notices, and interact in 7 Indian languages.

---

## Core Architecture & Features

- **Public Discovery & Editorial Civic UI**: Landing page (`/`), searchable/filterable Scheme Directory (`/schemes`) across 14 categories, Scheme Detail pages (`/schemes/:id`) linking directly to official portals (`myscheme.gov.in`, `scholarships.gov.in`, `pmkisan.gov.in`, `pmjay.gov.in`, `mudra.org.in`, etc.), How It Works (`/how-it-works`), About (`/about`), Privacy Policy (`/privacy`), and Terms (`/terms`).
- **Deterministic Eligibility Engine (`backend/services/eligibilityEngine.ts`)**: Never guessed by AI. Evaluates age/DOB, state, rural/urban residence, annual household income bracket, education, occupation/farmer status, disability, gender, and social category into `Likely Eligible`, `Potentially Eligible`, or `Not Currently Eligible`. Missing profile details never trigger a failure.
- **Citizen Workspace & Persistence (`backend/db/store.ts`)**: Real authentication (`scrypt` salted hashes + HMAC-SHA256 HTTP-only session cookies), 14-field optional Beneficiary Profile, Dashboard metrics and Recharts visualizations backed strictly by real user records, Application Preparation Checklists & Tracker (9 statuses + status history), Saved Schemes, Notifications & Personal Reminders, and DPDP data export / account deletion.
- **Grounded Gemini AI Guidance (`backend/ai/geminiService.ts`)**: Server-side `@google/genai` (`gemini-4-hydrogen`) powering the YojanaSathi AI Assistant (`/assistant`) with verified scheme citations and the **Understand My Rejection** multimodal analyzer (`/rejection-analyzer`) supporting PDF, PNG/JPG/WEBP, or pasted text.
- **Exact 7-Language Support & Persistent Theme**: English (`en`), Hindi (`hi`), Bengali (`bn`), Telugu (`te`), Marathi (`mr`), Tamil (`ta`), and Gujarati (`gu`), plus persistent Light & Dark mode.
- **Protected Admin Console (`/admin`)**: Strictly role-gated (`role === 'admin'`), enabling scheme creation/editing/archival, verification status updates, citizen feedback review, and immutable `adminAuditLogs`.

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Set GEMINI_API_KEY and SESSION_SECRET in .env

# 3. Run development server (Express + Vite on port 3000)
npm run dev

# 4. Run typecheck, build, and automated tests
npm run lint
npm run build
npm test
```

## Production Run

```bash
npm run build
NODE_ENV=production npm start
```

---

## Documentation Index

- `PROJECT_STATUS.md` — Verified completion status and deployment notes
- `docs/ARCHITECTURE.md` — System and runtime architecture
- `docs/DATABASE_SCHEMA.md` — Data models and collections
- `docs/FIRESTORE_SECURITY.md` — Hardened Firestore rules & RBAC design
- `docs/API_DOCUMENTATION.md` — Express REST API reference
- `docs/AI_IMPLEMENTATION.md` — Server-side Gemini AI integration & grounding
- `docs/LOCALIZATION.md` — 7-language translation system
- `docs/TESTING.md` — Automated unit, integration, and browser verification
- `docs/DEPLOYMENT.md` — Hosting, environment variables, and Firebase migration
- `docs/PRIVACY_AND_SECURITY.md` — Citizen data protection and privacy commitments
