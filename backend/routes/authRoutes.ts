import { Router } from 'express';
import { z } from 'zod';
import { getDb, mutateDb, toPublicUser } from '../db/store.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { requireAuth } from '../middleware/auth.ts';
import type { LanguageCode, UserAccount } from '../types/index.ts';
import { createSessionToken, generateId, hashPassword, verifyPassword } from '../utils/security.ts';

const router = Router();

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters.').max(120),
    email: z.string().trim().email('Please enter a valid email address.').max(180),
    password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
    confirmPassword: z.string().min(8).max(128),
    preferredLanguage: z.enum(['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu']).default('en'),
    acceptTerms: z.literal(true, {
      message: 'You must accept the Privacy Policy and Terms of Service.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

function setSessionCookie(res: import('express').Response, token: string) {
  res.cookie('ys_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function getAuthorizedAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAIL || 'admin@yojanasathi.in';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Invalid registration data.',
      issues: parsed.error.issues,
    });
  }

  const emailNormalized = parsed.data.email.toLowerCase();
  const existing = getDb().users.find((u) => u.email.toLowerCase() === emailNormalized);
  if (existing) {
    return res.status(409).json({
      error: 'An account with this email address already exists. Please log in instead.',
    });
  }

  const { hash, salt } = hashPassword(parsed.data.password);
  const now = new Date().toISOString();
  const isConfiguredAdmin = getAuthorizedAdminEmails().includes(emailNormalized);

  const newUser: UserAccount = {
    id: generateId('usr'),
    email: emailNormalized,
    passwordHash: hash,
    passwordSalt: salt,
    role: isConfiguredAdmin ? 'admin' : 'citizen',
    consentAccepted: true,
    consentTimestamp: now,
    preferredLanguage: parsed.data.preferredLanguage as LanguageCode,
    themePreference: 'light',
    profile: {
      fullName: parsed.data.fullName,
      age: null,
      dateOfBirth: '',
      gender: '',
      state: '',
      district: '',
      residence: '',
      incomeRange: '',
      socialCategory: '',
      educationLevel: '',
      currentCourse: '',
      employmentStatus: '',
      occupation: '',
      isFarmer: null,
      hasDisability: null,
      disabilityDetails: '',
      preferredLanguage: parsed.data.preferredLanguage as LanguageCode,
      updatedAt: now,
    },
    notificationPreferences: {
      statusChanges: true,
      upcomingDeadlines: true,
      incompletePreparation: true,
      profileReminders: true,
      schemeUpdates: true,
    },
    recentlyViewedSchemeIds: [],
    createdAt: now,
    updatedAt: now,
  };

  await mutateDb((db) => {
    db.users.push(newUser);
    db.notifications.push({
      id: generateId('notif'),
      userId: newUser.id,
      type: 'missing_profile',
      title: 'Complete your Beneficiary Profile',
      message:
        'Add your state, age, and household income bracket to unlock deterministic scheme eligibility matching.',
      isRead: false,
      createdAt: now,
    });
  });

  const token = createSessionToken(newUser.id, newUser.role);
  setSessionCookie(res, token);

  return res.status(201).json({
    token,
    user: toPublicUser(newUser),
  });
});

router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Invalid login credentials.',
    });
  }

  const emailNormalized = parsed.data.email.toLowerCase();
  const user = getDb().users.find((u) => u.email.toLowerCase() === emailNormalized);

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash, user.passwordSalt)) {
    return res.status(401).json({
      error: 'Invalid email address or password.',
    });
  }

  const token = createSessionToken(user.id, user.role);
  setSessionCookie(res, token);

  return res.json({
    token,
    user: toPublicUser(user),
  });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('ys_session', { path: '/' });
  return res.json({ ok: true });
});

router.get('/session', (req: AuthenticatedRequest, res) => {
  if (!req.authUser) {
    return res.json({ authenticated: false, user: null });
  }
  return res.json({ authenticated: true, user: toPublicUser(req.authUser) });
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  return res.json({ user: toPublicUser(req.authUser!) });
});

router.post('/forgot-password', async (req, res) => {
  const emailSchema = z.object({ email: z.string().trim().email('Please provide a valid email address.') });
  const parsed = emailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid email.' });
  }

  const emailNormalized = parsed.data.email.toLowerCase();
  const user = getDb().users.find((u) => u.email.toLowerCase() === emailNormalized);
  if (!user) {
    // Generic response to avoid account enumeration
    return res.json({
      ok: true,
      message:
        'If an account exists for that email, reset instructions are generated. Note: Automated SMTP email delivery is not configured in this environment.',
    });
  }

  const resetToken = generateId('rst');
  const expiresAt = Date.now() + 15 * 60 * 1000;

  await mutateDb((db) => {
    db.passwordResetTokens = db.passwordResetTokens.filter((t) => t.userId !== user.id && t.expiresAt > Date.now());
    db.passwordResetTokens.push({ token: resetToken, userId: user.id, expiresAt });
  });

  return res.json({
    ok: true,
    message:
      'Password reset code generated. Automated SMTP email delivery is not connected in this deployment; use the temporary reset code below within 15 minutes.',
    localVerificationCode: resetToken,
  });
});

router.post('/reset-password', async (req, res) => {
  const resetSchema = z
    .object({
      token: z.string().trim().min(6, 'Reset code is required.'),
      newPassword: z.string().min(8, 'New password must be at least 8 characters.').max(128),
      confirmPassword: z.string().min(8).max(128),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: 'Passwords do not match.',
      path: ['confirmPassword'],
    });

  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid reset request.' });
  }

  const record = getDb().passwordResetTokens.find(
    (t) => t.token === parsed.data.token && t.expiresAt > Date.now()
  );
  if (!record) {
    return res.status(400).json({ error: 'Invalid or expired password reset code.' });
  }

  const { hash, salt } = hashPassword(parsed.data.newPassword);
  await mutateDb((db) => {
    const user = db.users.find((u) => u.id === record.userId);
    if (user) {
      user.passwordHash = hash;
      user.passwordSalt = salt;
      user.updatedAt = new Date().toISOString();
    }
    db.passwordResetTokens = db.passwordResetTokens.filter((t) => t.token !== parsed.data.token);
  });

  return res.json({ ok: true, message: 'Your password has been updated. You may now log in.' });
});

router.delete('/account', requireAuth, async (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  await mutateDb((db) => {
    db.users = db.users.filter((u) => u.id !== uid);
    db.applications = db.applications.filter((a) => a.userId !== uid);
    db.savedSchemes = db.savedSchemes.filter((s) => s.userId !== uid);
    db.notifications = db.notifications.filter((n) => n.userId !== uid);
    db.conversations = db.conversations.filter((c) => c.userId !== uid);
    db.messages = db.messages.filter((m) => m.userId !== uid);
    db.rejectionAnalyses = db.rejectionAnalyses.filter((r) => r.userId !== uid);
    db.reminders = db.reminders.filter((r) => r.userId !== uid);
    db.passwordResetTokens = db.passwordResetTokens.filter((t) => t.userId !== uid);
  });

  res.clearCookie('ys_session', { path: '/' });
  return res.json({ ok: true, message: 'Your account and all associated personal data have been permanently deleted.' });
});

export default router;
