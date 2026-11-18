import { Router } from 'express';
import { localizeScheme } from '../data/schemeTranslations/index.ts';
import { getDb, mutateDb } from '../db/store.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { evaluateAllSchemes, evaluateEligibility } from '../services/eligibilityEngine.ts';
import type { EligibilityResult, UserProfile } from '../types/index.ts';
import { SCHEME_CATEGORIES } from '../types/index.ts';
import { getRequestLanguage } from '../utils/requestLang.ts';

const router = Router();

router.get('/', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const lang = getRequestLanguage(req);
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  const state = typeof req.query.state === 'string' ? req.query.state.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const classification = typeof req.query.classification === 'string' ? req.query.classification.trim() : '';
  const beneficiary = typeof req.query.beneficiary === 'string' ? req.query.beneficiary.trim().toLowerCase() : '';
  const education = typeof req.query.education === 'string' ? req.query.education.trim() : '';
  const incomeMaxRaw = typeof req.query.incomeMax === 'string' ? Number(req.query.incomeMax) : null;
  const availability = typeof req.query.availability === 'string' ? req.query.availability.trim() : '';
  const eligibilityFilter = typeof req.query.eligibility === 'string' ? req.query.eligibility.trim() : '';
  const sort = typeof req.query.sort === 'string' ? req.query.sort.trim() : 'name';
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(24, Math.max(1, Number(req.query.pageSize) || 9));

  // Public/citizen discovery only exposes non-Draft, non-Archived schemes
  let schemes = db.schemes.filter(
    (s) => s.verificationStatus !== 'Archived' && s.verificationStatus !== 'Draft'
  );

  if (q) {
    schemes = schemes.filter((s) => {
      const loc = localizeScheme(s, lang);
      return (
        s.name.toLowerCase().includes(q) ||
        loc.name.toLowerCase().includes(q) ||
        s.shortCode.toLowerCase().includes(q) ||
        s.officialDescription.toLowerCase().includes(q) ||
        loc.officialDescription.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        loc.department.toLowerCase().includes(q) ||
        s.targetBeneficiaries.some((b) => b.toLowerCase().includes(q)) ||
        loc.targetBeneficiaries.some((b) => b.toLowerCase().includes(q))
      );
    });
  }

  if (state && state !== 'All') {
    schemes = schemes.filter(
      (s) => s.applicableState === 'All India' || s.applicableState.toLowerCase() === state.toLowerCase()
    );
  }

  if (category && category !== 'All') {
    schemes = schemes.filter((s) => s.categories.includes(category as (typeof SCHEME_CATEGORIES)[number]));
  }

  if (classification && classification !== 'All') {
    schemes = schemes.filter((s) => s.classification === classification);
  }

  if (beneficiary && beneficiary !== 'all') {
    schemes = schemes.filter((s) => {
      const loc = localizeScheme(s, lang);
      return (
        s.targetBeneficiaries.some((b) => b.toLowerCase().includes(beneficiary)) ||
        loc.targetBeneficiaries.some((b) => b.toLowerCase().includes(beneficiary)) ||
        s.categories.some((c) => c.toLowerCase().includes(beneficiary))
      );
    });
  }

  if (education && education !== 'All') {
    schemes = schemes.filter(
      (s) =>
        !s.criteria.requiredEducationLevels ||
        s.criteria.requiredEducationLevels.length === 0 ||
        s.criteria.requiredEducationLevels.includes(education as UserProfile['educationLevel'])
    );
  }

  if (incomeMaxRaw !== null && Number.isFinite(incomeMaxRaw) && incomeMaxRaw > 0) {
    schemes = schemes.filter(
      (s) =>
        s.criteria.maxAnnualIncomeInr === null ||
        s.criteria.maxAnnualIncomeInr === undefined ||
        s.criteria.maxAnnualIncomeInr >= incomeMaxRaw
    );
  }

  if (availability && availability !== 'All') {
    schemes = schemes.filter((s) => s.applicationAvailability === availability);
  }

  const eligibilityMap = new Map<string, EligibilityResult>();
  if (req.authUser) {
    for (const scheme of schemes) {
      eligibilityMap.set(scheme.id, evaluateEligibility(req.authUser.profile, scheme, lang));
    }
  }

  if (eligibilityFilter && eligibilityFilter !== 'All' && req.authUser) {
    schemes = schemes.filter((s) => eligibilityMap.get(s.id)?.classification === eligibilityFilter);
  }

  // Sorting
  schemes.sort((a, b) => {
    if (sort === 'verifiedDate') {
      return b.lastVerifiedDate.localeCompare(a.lastVerifiedDate);
    }
    if (sort === 'eligibility' && req.authUser) {
      const rank = { 'Likely Eligible': 0, 'Potentially Eligible': 1, 'Not Currently Eligible': 2 };
      const ra = rank[eligibilityMap.get(a.id)?.classification || 'Potentially Eligible'];
      const rb = rank[eligibilityMap.get(b.id)?.classification || 'Potentially Eligible'];
      if (ra !== rb) return ra - rb;
    }
    return localizeScheme(a, lang).name.localeCompare(localizeScheme(b, lang).name, lang);
  });

  const total = schemes.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = schemes.slice(start, start + pageSize);

  return res.json({
    items: paged.map((scheme) => ({
      ...localizeScheme(scheme, lang),
      eligibility: eligibilityMap.get(scheme.id) || null,
    })),
    total,
    page: safePage,
    pageSize,
    totalPages,
    categories: SCHEME_CATEGORIES,
  });
});

function handleEligibilityEvaluate(req: AuthenticatedRequest, res: import('express').Response) {
  const db = getDb();
  const lang = getRequestLanguage(req);
  const activeSchemes = db.schemes.filter(
    (s) => s.verificationStatus !== 'Archived' && s.verificationStatus !== 'Draft'
  );
  const bodyProfile = (req.body && typeof req.body.profile === 'object' ? req.body.profile : null) as
    | Partial<UserProfile>
    | null;
  const profileToEvaluate: Partial<UserProfile> = bodyProfile || req.authUser?.profile || {};
  const schemeId = typeof req.body?.schemeId === 'string' ? req.body.schemeId : null;

  if (schemeId) {
    const scheme = activeSchemes.find((s) => s.id === schemeId);
    if (!scheme) return res.status(404).json({ error: 'Scheme not found.' });
    return res.json({
      result: evaluateEligibility(profileToEvaluate, scheme, lang),
      scheme: localizeScheme(scheme, lang),
    });
  }

  const results = evaluateAllSchemes(profileToEvaluate, activeSchemes, lang);
  return res.json({
    results,
    summary: {
      likelyEligible: results.filter((r) => r.classification === 'Likely Eligible').length,
      potentiallyEligible: results.filter((r) => r.classification === 'Potentially Eligible').length,
      notCurrentlyEligible: results.filter((r) => r.classification === 'Not Currently Eligible').length,
    },
  });
}

router.post('/eligibility/evaluate', handleEligibilityEvaluate);
router.post('/evaluate', handleEligibilityEvaluate);

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const lang = getRequestLanguage(req);
  const scheme = db.schemes.find((s) => s.id === req.params.id);
  if (!scheme || (scheme.verificationStatus === 'Draft' && req.authUser?.role !== 'admin')) {
    return res.status(404).json({ error: 'Scheme not found.' });
  }

  if (req.authUser) {
    const uid = req.authUser.id;
    await mutateDb((state) => {
      const user = state.users.find((u) => u.id === uid);
      if (user) {
        user.recentlyViewedSchemeIds = [
          scheme.id,
          ...user.recentlyViewedSchemeIds.filter((id) => id !== scheme.id),
        ].slice(0, 8);
      }
    });
  }

  const eligibility = req.authUser ? evaluateEligibility(req.authUser.profile, scheme, lang) : null;
  return res.json({ scheme: localizeScheme(scheme, lang), eligibility });
});

export default router;
