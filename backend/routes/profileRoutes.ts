import { Router } from 'express';
import { z } from 'zod';
import { getDb, mutateDb, toPublicUser } from '../db/store.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { requireAuth } from '../middleware/auth.ts';
import type { UserProfile } from '../types/index.ts';
import { generateId } from '../utils/security.ts';

const router = Router();

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters.').max(120),
  age: z.union([z.number().int().min(0).max(120), z.null()]).optional(),
  dateOfBirth: z.string().max(32).optional().default(''),
  gender: z.enum(['Female', 'Male', 'Other', 'Prefer Not to Say', '']).optional().default(''),
  state: z.string().max(80).optional().default(''),
  district: z.string().max(80).optional().default(''),
  residence: z.enum(['Rural', 'Urban', '']).optional().default(''),
  incomeRange: z
    .enum([
      'Below ₹1,00,000',
      '₹1,00,000 – ₹2,50,000',
      '₹2,50,000 – ₹5,00,000',
      '₹5,00,000 – ₹8,00,000',
      'Above ₹8,00,000',
      '',
    ])
    .optional()
    .default(''),
  socialCategory: z
    .enum(['General', 'OBC', 'SC', 'ST', 'EWS', 'Minority', 'Prefer Not to Say', ''])
    .optional()
    .default(''),
  educationLevel: z
    .enum([
      'No Formal Education',
      'Primary / Secondary (Up to Class 10)',
      'Higher Secondary (Class 12)',
      'Diploma / ITI',
      'Undergraduate',
      'Postgraduate & Above',
      '',
    ])
    .optional()
    .default(''),
  currentCourse: z.string().max(120).optional().default(''),
  employmentStatus: z
    .enum([
      'Student',
      'Unemployed',
      'Self-Employed / Entrepreneur',
      'Salaried',
      'Farmer / Agricultural Worker',
      'Homemaker',
      'Retired / Senior Citizen',
      '',
    ])
    .optional()
    .default(''),
  occupation: z.string().max(120).optional().default(''),
  isFarmer: z.union([z.boolean(), z.null()]).optional(),
  hasDisability: z.union([z.boolean(), z.null()]).optional(),
  disabilityDetails: z.string().max(240).optional().default(''),
  preferredLanguage: z.enum(['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu']).optional(),
  themePreference: z.enum(['light', 'dark']).optional(),
});

export function computeProfileCompletion(profile: UserProfile): {
  percentage: number;
  completedCount: number;
  totalCount: number;
  missingCoreFields: string[];
} {
  const checks: { label: string; filled: boolean; core?: boolean }[] = [
    { label: 'Full Name', filled: Boolean(profile.fullName?.trim()), core: true },
    { label: 'Age / Date of Birth', filled: Boolean(profile.age !== null && profile.age !== undefined) || Boolean(profile.dateOfBirth), core: true },
    { label: 'State', filled: Boolean(profile.state?.trim()), core: true },
    { label: 'District', filled: Boolean(profile.district?.trim()) },
    { label: 'Residence (Rural/Urban)', filled: Boolean(profile.residence), core: true },
    { label: 'Annual Household Income', filled: Boolean(profile.incomeRange), core: true },
    { label: 'Education Level', filled: Boolean(profile.educationLevel) },
    { label: 'Employment Status', filled: Boolean(profile.employmentStatus), core: true },
    { label: 'Gender', filled: Boolean(profile.gender) },
    { label: 'Preferred Language', filled: Boolean(profile.preferredLanguage) },
  ];
  const completedCount = checks.filter((c) => c.filled).length;
  const percentage = Math.round((completedCount / checks.length) * 100);
  const missingCoreFields = checks.filter((c) => c.core && !c.filled).map((c) => c.label);
  return { percentage, completedCount, totalCount: checks.length, missingCoreFields };
}

router.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  return res.json({
    profile: user.profile,
    completion: computeProfileCompletion(user.profile),
  });
});

router.put('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Invalid profile data.',
    });
  }

  const uid = req.authUser!.id;
  const now = new Date().toISOString();

  const updatedUser = await mutateDb((db) => {
    const user = db.users.find((u) => u.id === uid);
    if (!user) return null;

    const data = parsed.data;
    user.profile = {
      ...user.profile,
      fullName: data.fullName,
      age: data.age === undefined ? user.profile.age : data.age,
      dateOfBirth: data.dateOfBirth ?? user.profile.dateOfBirth,
      gender: data.gender ?? user.profile.gender,
      state: data.state ?? '',
      district: data.district ?? '',
      residence: data.residence ?? '',
      incomeRange: data.incomeRange ?? '',
      socialCategory: data.socialCategory ?? '',
      educationLevel: data.educationLevel ?? '',
      currentCourse: data.currentCourse ?? '',
      employmentStatus: data.employmentStatus ?? '',
      occupation: data.occupation ?? '',
      isFarmer: data.isFarmer === undefined ? user.profile.isFarmer ?? null : data.isFarmer,
      hasDisability: data.hasDisability === undefined ? user.profile.hasDisability ?? null : data.hasDisability,
      disabilityDetails: data.disabilityDetails ?? '',
      preferredLanguage: data.preferredLanguage || user.preferredLanguage,
      updatedAt: now,
    };

    if (data.preferredLanguage) {
      user.preferredLanguage = data.preferredLanguage;
    }
    if (data.themePreference) {
      user.themePreference = data.themePreference;
    }
    user.updatedAt = now;

    const completion = computeProfileCompletion(user.profile);
    if (completion.missingCoreFields.length === 0) {
      db.notifications.forEach((n) => {
        if (n.userId === uid && n.type === 'missing_profile') {
          n.isRead = true;
        }
      });
    }
    return user;
  });

  if (!updatedUser) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  return res.json({
    user: toPublicUser(updatedUser),
    profile: updatedUser.profile,
    completion: computeProfileCompletion(updatedUser.profile),
  });
});

router.patch('/preferences', requireAuth, async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    preferredLanguage: z.enum(['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu']).optional(),
    themePreference: z.enum(['light', 'dark']).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid preferences.' });
  }

  const uid = req.authUser!.id;
  const updatedUser = await mutateDb((db) => {
    const user = db.users.find((u) => u.id === uid);
    if (!user) return null;
    if (parsed.data.preferredLanguage) {
      user.preferredLanguage = parsed.data.preferredLanguage;
      user.profile.preferredLanguage = parsed.data.preferredLanguage;
    }
    if (parsed.data.themePreference) {
      user.themePreference = parsed.data.themePreference;
    }
    user.updatedAt = new Date().toISOString();
    return user;
  });

  if (!updatedUser) return res.status(404).json({ error: 'User not found.' });
  return res.json({ user: toPublicUser(updatedUser) });
});

router.get('/export-data', requireAuth, (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const db = getDb();
  const payload = {
    exportedAt: new Date().toISOString(),
    notice: 'YojanaSathi AI Citizen Data Export (DPDP Portability)',
    account: toPublicUser(req.authUser!),
    applications: db.applications.filter((a) => a.userId === uid),
    savedSchemes: db.savedSchemes.filter((s) => s.userId === uid),
    notifications: db.notifications.filter((n) => n.userId === uid),
    reminders: db.reminders.filter((r) => r.userId === uid),
    conversations: db.conversations.filter((c) => c.userId === uid),
    messages: db.messages.filter((m) => m.userId === uid),
    rejectionAnalyses: db.rejectionAnalyses.filter((r) => r.userId === uid),
  };

  res.setHeader('Content-Disposition', 'attachment; filename="yojanasathi-my-data.json"');
  return res.json(payload);
});

router.delete('/personal-records', requireAuth, async (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const now = new Date().toISOString();
  await mutateDb((db) => {
    db.applications = db.applications.filter((a) => a.userId !== uid);
    db.savedSchemes = db.savedSchemes.filter((s) => s.userId !== uid);
    db.notifications = db.notifications.filter((n) => n.userId !== uid);
    db.conversations = db.conversations.filter((c) => c.userId !== uid);
    db.messages = db.messages.filter((m) => m.userId !== uid);
    db.rejectionAnalyses = db.rejectionAnalyses.filter((r) => r.userId !== uid);
    db.reminders = db.reminders.filter((r) => r.userId !== uid);
    db.notifications.push({
      id: generateId('notif'),
      userId: uid,
      type: 'personal_reminder',
      title: 'Personal activity records cleared',
      message: 'Your saved schemes, applications, AI chats, and rejection analysis records have been erased.',
      isRead: false,
      createdAt: now,
    });
  });

  return res.json({ ok: true, message: 'All personal workspace records have been cleared.' });
});

export default router;
