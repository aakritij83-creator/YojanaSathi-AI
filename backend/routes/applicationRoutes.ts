import { Router } from 'express';
import { z } from 'zod';
import { translateProfileField } from '../data/domainTranslations.ts';
import { localizeScheme } from '../data/schemeTranslations/index.ts';
import { getDb, mutateDb } from '../db/store.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { requireAuth } from '../middleware/auth.ts';
import { evaluateAllSchemes } from '../services/eligibilityEngine.ts';
import { APPLICATION_STATUSES, type ApplicationRecord, type LanguageCode } from '../types/index.ts';
import { getRequestLanguage } from '../utils/requestLang.ts';
import { generateId } from '../utils/security.ts';
import { computeProfileCompletion } from './profileRoutes.ts';

const router = Router();

// --- Saved / Bookmarked Schemes ---
router.get('/saved-schemes', requireAuth, (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const db = getDb();
  const saved = db.savedSchemes
    .filter((s) => s.userId === uid)
    .map((s) => {
      const scheme = db.schemes.find((sc) => sc.id === s.schemeId);
      return scheme ? { ...s, scheme } : null;
    })
    .filter(Boolean);

  return res.json({ items: saved });
});

router.post('/saved-schemes', requireAuth, async (req: AuthenticatedRequest, res) => {
  const schemeId = typeof req.body?.schemeId === 'string' ? req.body.schemeId.trim() : '';
  const db = getDb();
  const scheme = db.schemes.find((s) => s.id === schemeId && s.verificationStatus !== 'Archived');
  if (!scheme) return res.status(404).json({ error: 'Scheme not found.' });

  const uid = req.authUser!.id;
  const already = db.savedSchemes.find((s) => s.userId === uid && s.schemeId === schemeId);
  if (already) return res.json({ item: already });

  const record = {
    id: generateId('sav'),
    userId: uid,
    schemeId,
    savedAt: new Date().toISOString(),
  };

  await mutateDb((state) => {
    state.savedSchemes.push(record);
  });

  return res.status(201).json({ item: record });
});

router.delete('/saved-schemes/:schemeId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const schemeId = req.params.schemeId;
  await mutateDb((state) => {
    state.savedSchemes = state.savedSchemes.filter((s) => !(s.userId === uid && s.schemeId === schemeId));
  });
  return res.json({ ok: true });
});

// --- Application Tracker & Preparation ---
router.get('/applications', requireAuth, (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const db = getDb();
  const items = db.applications
    .filter((a) => a.userId === uid)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((app) => ({
      ...app,
      scheme: db.schemes.find((s) => s.id === app.schemeId) || null,
    }));
  return res.json({ items });
});

router.post('/applications', requireAuth, async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    schemeId: z.string().min(1),
    currentStatus: z.enum(APPLICATION_STATUSES as [string, ...string[]]).optional().default('Interested'),
    applicationReference: z.string().max(80).optional().default(''),
    notes: z.string().max(1500).optional().default(''),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid application data.' });
  }

  const db = getDb();
  const scheme = db.schemes.find((s) => s.id === parsed.data.schemeId);
  if (!scheme) return res.status(404).json({ error: 'Scheme not found.' });

  const uid = req.authUser!.id;
  const existing = db.applications.find((a) => a.userId === uid && a.schemeId === scheme.id);
  if (existing) {
    return res.status(409).json({
      error: 'You already have an application tracker entry for this scheme.',
      item: existing,
    });
  }

  const now = new Date().toISOString();
  const initialStatus = parsed.data.currentStatus as ApplicationRecord['currentStatus'];
  const record: ApplicationRecord = {
    id: generateId('app'),
    userId: uid,
    schemeId: scheme.id,
    schemeName: scheme.name,
    applicationReference: parsed.data.applicationReference,
    applicationDate: initialStatus === 'Submitted' ? now.slice(0, 10) : '',
    currentStatus: initialStatus,
    statusSource: 'Self-Reported',
    collectedDocuments: [],
    completedTasks: [],
    notes: parsed.data.notes,
    statusHistory: [
      {
        status: initialStatus,
        changedAt: now,
        note: 'Application preparation created by user.',
        source: 'Self-Reported',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  await mutateDb((state) => {
    state.applications.push(record);
    if (req.authUser!.notificationPreferences.statusChanges) {
      state.notifications.push({
        id: generateId('notif'),
        userId: uid,
        type: 'status_change',
        title: `Tracking started: ${scheme.shortCode}`,
        message: `Added ${scheme.name} to your Application Tracker with self-reported status "${initialStatus}".`,
        relatedSchemeId: scheme.id,
        isRead: false,
        createdAt: now,
      });
    }
  });

  return res.status(201).json({ item: { ...record, scheme } });
});

router.patch('/applications/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    currentStatus: z.enum(APPLICATION_STATUSES as [string, ...string[]]).optional(),
    applicationReference: z.string().max(80).optional(),
    applicationDate: z.string().max(32).optional(),
    collectedDocuments: z.array(z.string().max(240)).max(30).optional(),
    completedTasks: z.array(z.string().max(240)).max(30).optional(),
    notes: z.string().max(1500).optional(),
    statusChangeNote: z.string().max(300).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid update payload.' });
  }

  const uid = req.authUser!.id;
  const appId = req.params.id;
  const now = new Date().toISOString();

  const updated = await mutateDb((state) => {
    const app = state.applications.find((a) => a.id === appId && a.userId === uid);
    if (!app) return null;

    const d = parsed.data;
    if (d.applicationReference !== undefined) app.applicationReference = d.applicationReference;
    if (d.applicationDate !== undefined) app.applicationDate = d.applicationDate;
    if (d.collectedDocuments !== undefined) app.collectedDocuments = d.collectedDocuments;
    if (d.completedTasks !== undefined) app.completedTasks = d.completedTasks;
    if (d.notes !== undefined) app.notes = d.notes;

    if (d.currentStatus && d.currentStatus !== app.currentStatus) {
      app.currentStatus = d.currentStatus as ApplicationRecord['currentStatus'];
      if (d.currentStatus === 'Submitted' && !app.applicationDate) {
        app.applicationDate = now.slice(0, 10);
      }
      app.statusHistory.unshift({
        status: app.currentStatus,
        changedAt: now,
        note: d.statusChangeNote || `Status updated manually to ${app.currentStatus}.`,
        source: 'Self-Reported',
      });
      if (req.authUser!.notificationPreferences.statusChanges) {
        state.notifications.push({
          id: generateId('notif'),
          userId: uid,
          type: 'status_change',
          title: `Status updated: ${app.schemeName}`,
          message: `Self-reported status changed to "${app.currentStatus}".`,
          relatedSchemeId: app.schemeId,
          isRead: false,
          createdAt: now,
        });
      }
    }

    app.updatedAt = now;
    return app;
  });

  if (!updated) return res.status(404).json({ error: 'Application record not found.' });
  const scheme = getDb().schemes.find((s) => s.id === updated.schemeId) || null;
  return res.json({ item: { ...updated, scheme } });
});

router.delete('/applications/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const appId = req.params.id;
  const removed = await mutateDb((state) => {
    const before = state.applications.length;
    state.applications = state.applications.filter((a) => !(a.id === appId && a.userId === uid));
    return state.applications.length < before;
  });
  if (!removed) return res.status(404).json({ error: 'Application record not found.' });
  return res.json({ ok: true });
});

const DASHBOARD_PENDING_COPY: Record<
  LanguageCode,
  {
    completeTitle: string;
    missingPrefix: (fields: string) => string;
    prepTitle: (label: string) => string;
    prepDetail: (done: number, total: number) => string;
  }
> = {
  en: {
    completeTitle: 'Complete core profile fields',
    missingPrefix: (f) => `Missing: ${f}`,
    prepTitle: (s) => `Prepare documents for ${s}`,
    prepDetail: (d, t) => `${d} of ${t} documents marked ready`,
  },
  hi: {
    completeTitle: 'मुख्य प्रोफ़ाइल फ़ील्ड पूरे करें',
    missingPrefix: (f) => `अधूरा विवरण: ${f}`,
    prepTitle: (s) => `${s} के लिए दस्तावेज़ तैयार करें`,
    prepDetail: (d, t) => `${t} में से ${d} दस्तावेज़ तैयार चिह्नित`,
  },
  bn: {
    completeTitle: 'মূল প্রোফাইল তথ্য সম্পূর্ণ করুন',
    missingPrefix: (f) => `অনুপস্থিত: ${f}`,
    prepTitle: (s) => `${s}-এর জন্য নথিপত্র প্রস্তুত করুন`,
    prepDetail: (d, t) => `${t}-এর মধ্যে ${d}টি নথি প্রস্তুত চিহ্নিত`,
  },
  te: {
    completeTitle: 'ప్రధాన ప్రొఫైల్ ఫీల్డ్‌లను పూర్తి చేయండి',
    missingPrefix: (f) => `లోపించినవి: ${f}`,
    prepTitle: (s) => `${s} కోసం పత్రాలను సిద్ధం చేయండి`,
    prepDetail: (d, t) => `${t} లో ${d} పత్రాలు సిద్ధంగా గుర్తించబడ్డాయి`,
  },
  mr: {
    completeTitle: 'मुख्य प्रोफाइल माहिती पूर्ण करा',
    missingPrefix: (f) => `बाकी माहिती: ${f}`,
    prepTitle: (s) => `${s} साठी कागदपत्रे तयार करा`,
    prepDetail: (d, t) => `${t} पैकी ${d} कागदपत्रे तयार चिन्हांकित`,
  },
  ta: {
    completeTitle: 'முதன்மை சுயவிவர புலங்களை நிறைவு செய்யவும்',
    missingPrefix: (f) => `விடுபட்டவை: ${f}`,
    prepTitle: (s) => `${s}-க்கான ஆவணங்களைத் தயாரிக்கவும்`,
    prepDetail: (d, t) => `${t}-இல் ${d} ஆவணங்கள் தயாராகக் குறிக்கப்பட்டுள்ளன`,
  },
  gu: {
    completeTitle: 'મુખ્ય પ્રોફાઇલ ફીલ્ડ્સ પૂર્ણ કરો',
    missingPrefix: (f) => `બાકી માહિતી: ${f}`,
    prepTitle: (s) => `${s} માટે દસ્તાવેજો તૈયાર કરો`,
    prepDetail: (d, t) => `${t} માંથી ${d} દસ્તાવેજો તૈયાર ચિહ્નિત`,
  },
};

// --- Personalized Dashboard Aggregation (Zero Fabricated Numbers) ---
router.get('/dashboard', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const uid = user.id;
  const db = getDb();
  const lang = getRequestLanguage(req);
  const copy = DASHBOARD_PENDING_COPY[lang] || DASHBOARD_PENDING_COPY.en;

  const activeSchemes = db.schemes.filter(
    (s) => s.verificationStatus !== 'Archived' && s.verificationStatus !== 'Draft'
  );
  const eligibilityResults = evaluateAllSchemes(user.profile, activeSchemes, lang);
  const matchingResults = eligibilityResults.filter((r) => r.classification === 'Likely Eligible');
  const potentialResults = eligibilityResults.filter((r) => r.classification === 'Potentially Eligible');

  const userSaved = db.savedSchemes.filter((s) => s.userId === uid);
  const userApps = db.applications.filter((a) => a.userId === uid);
  const inProgressStatuses = new Set([
    'Interested',
    'Preparing Documents',
    'Ready to Apply',
    'Submitted',
    'Under Review',
    'Additional Information Required',
  ]);
  const inProgressApps = userApps.filter((a) => inProgressStatuses.has(a.currentStatus));
  const approvedApps = userApps.filter((a) => a.currentStatus === 'Approved');

  const recommendedSchemes = [...matchingResults, ...potentialResults]
    .slice(0, 4)
    .map((elig) => {
      const found = activeSchemes.find((s) => s.id === elig.schemeId);
      return found ? { scheme: localizeScheme(found, lang), eligibility: elig } : null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const recentlyViewed = user.recentlyViewedSchemeIds
    .map((id) => activeSchemes.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => localizeScheme(s, lang));

  const upcomingDeadlines = activeSchemes
    .filter((s) => Boolean(s.applicationDeadlineIso))
    .sort((a, b) => (a.applicationDeadlineIso || '').localeCompare(b.applicationDeadlineIso || ''))
    .slice(0, 5)
    .map((s) => localizeScheme(s, lang));

  const notifications = db.notifications
    .filter((n) => n.userId === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const profileCompletion = computeProfileCompletion(user.profile);

  const pendingActions: { id: string; title: string; detail: string; href: string }[] = [];
  if (profileCompletion.missingCoreFields.length > 0) {
    const localizedMissing = profileCompletion.missingCoreFields
      .map((field) => translateProfileField(field, lang))
      .join(', ');
    pendingActions.push({
      id: 'complete-profile',
      title: copy.completeTitle,
      detail: copy.missingPrefix(localizedMissing),
      href: '/profile',
    });
  }
  for (const app of inProgressApps.slice(0, 3)) {
    const scheme = activeSchemes.find((s) => s.id === app.schemeId);
    const totalDocs = scheme?.requiredDocuments.length || 0;
    if (totalDocs > 0 && app.collectedDocuments.length < totalDocs) {
      const locScheme = scheme ? localizeScheme(scheme, lang) : null;
      pendingActions.push({
        id: `docs-${app.id}`,
        title: copy.prepTitle(locScheme?.shortCode || locScheme?.name || app.schemeName),
        detail: copy.prepDetail(app.collectedDocuments.length, totalDocs),
        href: '/tracker',
      });
    }
  }

  const eligibilityChartData = [
    { name: 'Likely Eligible', count: matchingResults.length },
    { name: 'Potentially Eligible', count: potentialResults.length },
    {
      name: 'Not Eligible',
      count: eligibilityResults.filter((r) => r.classification === 'Not Currently Eligible').length,
    },
  ];

  const applicationStatusChart = [
    { stage: 'Preparation', count: userApps.filter((a) => ['Interested', 'Preparing Documents', 'Ready to Apply'].includes(a.currentStatus)).length },
    { stage: 'Submitted / Review', count: userApps.filter((a) => ['Submitted', 'Under Review', 'Additional Information Required'].includes(a.currentStatus)).length },
    { stage: 'Approved', count: approvedApps.length },
    { stage: 'Closed / Rejected', count: userApps.filter((a) => ['Rejected', 'Closed'].includes(a.currentStatus)).length },
  ];

  return res.json({
    metrics: {
      matchingSchemesCount: matchingResults.length,
      potentiallyEligibleCount: potentialResults.length,
      savedSchemesCount: userSaved.length,
      applicationsInProgressCount: inProgressApps.length,
      approvedApplicationsCount: approvedApps.length,
      unreadNotificationsCount: notifications.filter((n) => !n.isRead).length,
    },
    profileCompletion,
    recommendedSchemes,
    recentlyViewed,
    upcomingDeadlines,
    pendingActions,
    recentNotifications: notifications.slice(0, 5),
    applications: userApps.slice(0, 5),
    charts: {
      eligibilityChartData,
      applicationStatusChart,
    },
  });
});

export default router;
