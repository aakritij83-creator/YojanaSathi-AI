# Privacy & Citizen Security Commitments

1. **Minimal Data Collection**: Citizens never provide Aadhaar numbers, bank account numbers, IFSC codes, PAN cards, or government portal OTPs inside YojanaSathi AI.
2. **Optional Beneficiary Profile**: Every field after registration is optional and editable; missing fields never penalize eligibility checks (`Potentially Eligible` is shown instead of rejection).
3. **Password & Session Security**: Passwords use random 16-byte salts with `crypto.scryptSync` (64-byte key) and constant-time comparison (`crypto.timingSafeEqual`). Sessions use signed HMAC-SHA256 tokens stored in `httpOnly`, `sameSite=lax` cookies.
4. **Data Portability & Erasure**: Signed-in citizens can download all personal records in JSON (`GET /api/profile/export-data`), clear workspace records (`DELETE /api/profile/personal-records`), or permanently delete their account and associated records (`DELETE /api/auth/account`).
5. **No AI Training Leakage Guarantee**: Gemini requests run server-side only; sensitive identifiers are never requested, and rejection notice documents are processed only to generate the user's analysis record, which users can delete anytime.
