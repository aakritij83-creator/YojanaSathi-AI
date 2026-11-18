# AI Implementation & Grounding

## Server-Side SDK & Model
- Uses `@google/genai` strictly inside `backend/ai/geminiService.ts` (`GEMINI_API_KEY` never leaves the server).
- Model used: `gemini-4-hydrogen` with structured `responseSchema` JSON responses.

## Grounding Guardrails
1. **Deterministic Eligibility First**: AI never decides eligibility. Before invoking Gemini chat, `aiRoutes.ts` optionally attaches pre-computed results from `evaluateAllSchemes()` alongside verified schemes from the catalog.
2. **Citation Enforcement**: Every assistant answer returns structured `citations` (`schemeId`, `schemeName`, `officialSourceUrl`) and a `couldVerify` flag instructing the model not to invent unlisted schemes, dates, or portal URLs.
3. **Rejection Notice Evidence Separation**: `analyzeRejectionNotice` strictly separates:
   - `confirmedReasons` (explicitly stated in the uploaded PDF/image or pasted text)
   - `possibleContributingReasons` (hypotheses requiring portal/official confirmation)
   - `clarificationQuestions`, `missingOrMismatchedDocuments`, `actionChecklist`, `grievanceChannels`
4. **Honest Error Handling**: If `GEMINI_API_KEY` is missing, rate-limited, or upstream errors occur, `mapGeminiError` returns an explicit status code (`503 GEMINI_NOT_CONFIGURED`, `429`, `502`) rather than fake AI replies.
5. **Input Security**: Uploaded files are validated via MIME allowlist (`application/pdf`, `image/png`, `image/jpeg`, `image/webp`), 5 MB size cap, and binary magic-byte header verification.
