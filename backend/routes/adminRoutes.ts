import { Router } from 'express';
import { z } from 'zod';
import { getDb, mutateDb } from '../db/store.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { requireAdmin, requireAuth } from '../middleware/auth.ts';
import { SCHEME_CATEGORIES, type GovernmentScheme, type VerificationStatus } from '../types/index.ts';
import { generateId } from '../utils/security.ts';

const router = Router();

// --- Public / Citizen Feedback Submission ---
router.post('/feedback', async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    category: z.enum(['Scheme Accuracy', 'Bug Report', 'Translation', 'General Feedback']),
    schemeId: z.string().max(80).optional(),
    message: z.string().trim().min(5, 'Feedback message must be at least 5 characters.').max(1500),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid feedback.' });
  }

  const record = {
    id: generateId('fb'),
    userId: req.authUser?.id || null,
    userEmail: req.authUser?.email,
    category: parsed.data.category,
    schemeId: parsed.data.schemeId,
    message: parsed.data.message,
    status: 'Open' as const,
    createdAt: new Date().toISOString(),
  };

  await mutateDb((db) => {
    db.feedback.push(record);
  });

  return res.status(201).json({ item: record });
});

// --- Strictly Protected Admin Routes ---
const schemePayloadSchema = z.object({
  name: z.string().trim().min(3).max(200),
  shortCode: z.string().trim().min(2).max(32),
  officialDescription: z.string().trim().min(10).max(2000),
  department: z.string().trim().min(2).max(200),
  classification: z.enum(['Central', 'State']),
  applicableState: z.string().trim().min(2).max(80),
  categories: z.array(z.enum(SCHEME_CATEGORIES as unknown as [string, ...string[]])).min(1),
  targetBeneficiaries: z.array(z.string().trim().min(1).max(120)).min(1),
  eligibilityRequirementsSummary: z.array(z.string().trim().min(1).max(400)).min(1),
  ageRestrictionsText: z.string().max(200).default('Refer official guidelines'),
  incomeRestrictionsText: z.string().max(200).default('Refer official guidelines'),
  educationRequirementsText: z.string().max(200).default('Refer official guidelines'),
  categoryRestrictionsText: z.string().max(200).default('Refer official guidelines'),
  benefits: z.array(z.string().trim().min(1).max(400)).min(1),
  requiredDocuments: z.array(z.string().trim().min(1).max(200)).min(1),
  applicationProcedure: z.array(z.string().trim().min(1).max(400)).min(1),
  preparationTasks: z.array(z.string().trim().min(1).max(250)).default([]),
  applicationDatesText: z.string().max(200).default('Check official portal'),
  applicationDeadlineIso: z.string().nullable().optional().default(null),
  applicationAvailability: z.enum(['Open Year-Round', 'Seasonal Window', 'Check Official Portal']).default('Check Official Portal'),
  officialApplicationUrl: z.string().url('Official application URL must be a valid https URL.'),
  officialSourceUrl: z.string().url('Official source URL must be a valid https URL.'),
  lastVerifiedDate: z.string().min(4).max(32),
  verificationStatus: z.enum(['Draft', 'Verification Required', 'Verified', 'Needs Review', 'Archived']),
  criteria: z.object({
    minAge: z.number().nullable().optional().default(null),
    maxAge: z.number().nullable().optional().default(null),
    maxAnnualIncomeInr: z.number().nullable().optional().default(null),
    allowedStates: z.array(z.string()).min(1).default(['All India']),
    allowedResidences: z.array(z.enum(['Rural', 'Urban'])).default([]),
    requiresFarmer: z.boolean().optional(),
    requiresDisability: z.boolean().optional(),
    genderRestriction: z.enum(['Female', 'Male']).nullable().optional(),
  }),
  grievanceResource: z.string().max(300).optional(),
});

router.get('/admin/overview', requireAuth, requireAdmin, (_req, res) => {
  const db = getDb();
  const statusCounts: Record<VerificationStatus, number> = {
    Draft: 0,
    'Verification Required': 0,
    Verified: 0,
    'Needs Review': 0,
    Archived: 0,
  };
  for (const s of db.schemes) {
    statusCounts[s.verificationStatus]++;
  }
  return res.json({
    totalSchemes: db.schemes.length,
    statusCounts,
    openFeedbackCount: db.feedback.filter((f) => f.status === 'Open').length,
    totalUsersCount: db.users.length,
    totalAuditLogs: db.adminAuditLogs.length,
    categories: SCHEME_CATEGORIES,
  });
});

router.get('/admin/schemes', requireAuth, requireAdmin, (_req, res) => {
  const db = getDb();
  return res.json({ items: db.schemes });
});

router.post('/admin/schemes', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const parsed = schemePayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid scheme data.' });
  }

  const now = new Date().toISOString();
  const scheme: GovernmentScheme = {
    id: generateId('sch'),
    ...parsed.data,
    categories: parsed.data.categories as GovernmentScheme['categories'],
    faqs: [],
  };

  await mutateDb((db) => {
    db.schemes.unshift(scheme);
    db.adminAuditLogs.unshift({
      id: generateId('aud'),
      adminUserId: req.authUser!.id,
      adminEmail: req.authUser!.email,
      action: 'CREATE_SCHEME',
      targetType: 'scheme',
      targetId: scheme.id,
      details: `Created scheme "${scheme.name}" (${scheme.verificationStatus})`,
      createdAt: now,
    });
  });

  return res.status(201).json({ item: scheme });
});

router.put('/admin/schemes/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const parsed = schemePayloadSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid scheme update.' });
  }

  const schemeId = req.params.id;
  const now = new Date().toISOString();
  const updated = await mutateDb((db) => {
    const idx = db.schemes.findIndex((s) => s.id === schemeId);
    if (idx === -1) return null;
    const prev = db.schemes[idx];
    const next: GovernmentScheme = {
      ...prev,
      ...parsed.data,
      categories: (parsed.data.categories as GovernmentScheme['categories']) || prev.categories,
      criteria: parsed.data.criteria ? { ...prev.criteria, ...parsed.data.criteria } : prev.criteria,
    };
    db.schemes[idx] = next;
    db.adminAuditLogs.unshift({
      id: generateId('aud'),
      adminUserId: req.authUser!.id,
      adminEmail: req.authUser!.email,
      action: 'UPDATE_SCHEME',
      targetType: 'scheme',
      targetId: next.id,
      details: `Updated "${next.name}" — status: ${next.verificationStatus}, verified: ${next.lastVerifiedDate}`,
      createdAt: now,
    });
    return next;
  });

  if (!updated) return res.status(404).json({ error: 'Scheme not found.' });
  return res.json({ item: updated });
});

router.post('/admin/schemes/:id/archive', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const schemeId = req.params.id;
  const now = new Date().toISOString();
  const updated = await mutateDb((db) => {
    const scheme = db.schemes.find((s) => s.id === schemeId);
    if (!scheme) return null;
    scheme.verificationStatus = 'Archived';
    db.adminAuditLogs.unshift({
      id: generateId('aud'),
      adminUserId: req.authUser!.id,
      adminEmail: req.authUser!.email,
      action: 'ARCHIVE_SCHEME',
      targetType: 'scheme',
      targetId: scheme.id,
      details: `Archived scheme "${scheme.name}"`,
      createdAt: now,
    });
    return scheme;
  });

  if (!updated) return res.status(404).json({ error: 'Scheme not found.' });
  return res.json({ item: updated });
});

router.get('/admin/feedback', requireAuth, requireAdmin, (_req, res) => {
  const items = [...getDb().feedback].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return res.json({ items });
});

router.patch('/admin/feedback/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    status: z.enum(['Open', 'Reviewed', 'Resolved']),
    adminNote: z.string().max(500).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid feedback status.' });

  const id = req.params.id;
  const now = new Date().toISOString();
  const updated = await mutateDb((db) => {
    const fb = db.feedback.find((f) => f.id === id);
    if (!fb) return null;
    fb.status = parsed.data.status;
    if (parsed.data.adminNote !== undefined) fb.adminNote = parsed.data.adminNote;
    db.adminAuditLogs.unshift({
      id: generateId('aud'),
      adminUserId: req.authUser!.id,
      adminEmail: req.authUser!.email,
      action: 'REVIEW_FEEDBACK',
      targetType: 'feedback',
      targetId: fb.id,
      details: `Marked feedback as ${fb.status}`,
      createdAt: now,
    });
    return fb;
  });

  if (!updated) return res.status(404).json({ error: 'Feedback not found.' });
  return res.json({ item: updated });
});

router.get('/admin/audit-logs', requireAuth, requireAdmin, (_req, res) => {
  return res.json({ items: getDb().adminAuditLogs.slice(0, 100) });
});

export default router;
