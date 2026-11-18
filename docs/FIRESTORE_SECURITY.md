# Firestore Security & RBAC Design

The security rules template at `firebase/firestore.rules` implements strict least-privilege authorization across all YojanaSathi AI collections:

1. **Deny by Default**: Fallback `match /{document=**} { allow read, write: if false; }` denies any unmapped collection.
2. **Citizen Ownership Isolation**: `savedSchemes`, `applications`, `notifications`, `reminders`, `conversations`, `messages`, and `rejectionAnalyses` require `request.auth.uid == resource.data.userId` on reads/updates/deletes and `request.resource.data.userId == request.auth.uid` on creation.
3. **Anti-Privilege Escalation**: Creating `/users/{userId}` mandates `request.resource.data.role == 'citizen'`, and updating `/users/{userId}` enforces `request.resource.data.role == resource.data.role` and immutable `createdAt`.
4. **Admin Verification**: `isAdmin()` requires custom token claim `admin == true` or server-verified `users/{uid}.data.role == 'admin'`. Only admins can mutate `/schemes`, read/resolve `/feedback`, or read/append `/adminAuditLogs`.
5. **Immutable Audit & Message Logs**: `/adminAuditLogs` and `/messages` forbid client `update` operations (`allow update: if false`), and audit logs forbid `delete`.
6. **Express Runtime Parity**: The Node/Express middleware (`backend/middleware/auth.ts`) enforces identical isolation via `requireAuth` and `requireAdmin`, plus server-side filtering on `req.authUser.id` for every user-scoped route.
