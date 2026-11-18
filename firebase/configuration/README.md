# Firebase Configuration & External Deployment Guide

In this workspace, Firebase provisioning was declined during setup, so live authentication and persistence run cleanly on the Express backend (`backend/db/store.ts` with `scrypt` password hashing and HMAC-SHA256 HTTP-only session cookies).

If you deploy YojanaSathi AI with external Firebase Authentication and Cloud Firestore:

1. **Create a Firebase Project** in the Firebase Console and enable **Email/Password** and **Google** providers under *Authentication -> Sign-in method*.
2. **Deploy Security Rules & Indexes**:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
   Use the hardened rules in `firebase/firestore.rules` and indexes in `firebase/firestore.indexes.json`.
3. **Provision Admin Claims via Firebase Admin SDK** (never via client writes or registration payloads):
   ```ts
   await adminAuth.setCustomUserClaims(uid, { admin: true });
   ```
4. **Never commit real credentials** (`firebase-service-account.json`, `.env`) into version control.
