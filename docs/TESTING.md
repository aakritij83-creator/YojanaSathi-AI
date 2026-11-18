# Testing & Verification

## Automated Test Suites (`npm test`)
Executed via `npx tsx --test tests/*.test.ts`:
1. **`tests/eligibility.test.ts`**:
   - Tests income bracket parsing and age/DOB derivation.
   - Verifies `Likely Eligible`, `Potentially Eligible`, and `Not Currently Eligible` outcomes across Central and State schemes.
   - Confirms missing profile fields NEVER trigger eligibility failure.
   - Verifies AB-PMJAY 70+ senior income exemption, Stand-Up India Woman OR SC/ST inclusive logic, and Archived scheme exclusion.
2. **`tests/security-and-localization.test.ts`**:
   - Verifies per-user salted `scrypt` password hashing and verification.
   - Verifies HMAC session token signing, tampering rejection, and expiry rejection.
   - Verifies exact 7-language list and 100% translation key parity across `en`, `hi`, `bn`, `te`, `mr`, `ta`, `gu`.
3. **`tests/api-integration.test.ts`**:
   - Boots `createApp()` on an ephemeral port and verifies health check, 401 unauthenticated guards, 403 citizen-vs-admin RBAC enforcement, anti-privilege escalation during registration, duplicate email `409`, profile save, eligibility API evaluation, bookmarking, tracker status history, rejection analyzer input validation (`400`), feedback submission, and full account deletion cleanup.

## Static & Build Verification
- `npm run lint` (`tsc --noEmit`) validates strict TypeScript compilation across frontend, backend, and tests.
- `npm run build` (`vite build`) verifies production client asset bundling.
