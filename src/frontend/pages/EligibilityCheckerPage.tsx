import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, HelpCircle, XCircle } from 'lucide-react';
import { INDIAN_STATES_AND_UTS } from '../../../backend/data/verifiedSchemes.ts';
import type { EligibilityClassification, EligibilityResult, UserProfile } from '../../../backend/types/index.ts';
import { EligibilityStatusText, ErrorBanner, LoadingSkeleton } from '../components/UiPrimitives.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { DashboardLayout } from '../layouts/DashboardLayout.tsx';
import { PublicLayout } from '../layouts/PublicLayout.tsx';
import { apiRequest } from '../services/api.ts';
import {
  translateEducationLevel,
  translateEmploymentStatus,
  translateGender,
  translateIncomeRange,
  translateResidence,
  translateSocialCategory,
  translateState,
  translateVerificationStatus,
} from '../translations/domainLabels.ts';

interface EvaluateResponse {
  results: EligibilityResult[];
  summary: {
    likelyEligible: number;
    potentiallyEligible: number;
    notCurrentlyEligible: number;
  };
}

const RESIDENCE_OPTIONS: Array<Exclude<UserProfile['residence'], ''>> = ['Rural', 'Urban'];
const INCOME_OPTIONS: Array<Exclude<UserProfile['incomeRange'], ''>> = [
  'Below ₹1,00,000',
  '₹1,00,000 – ₹2,50,000',
  '₹2,50,000 – ₹5,00,000',
  '₹5,00,000 – ₹8,00,000',
  'Above ₹8,00,000',
];
const EDUCATION_OPTIONS: Array<Exclude<UserProfile['educationLevel'], ''>> = [
  'No Formal Education',
  'Primary / Secondary (Up to Class 10)',
  'Higher Secondary (Class 12)',
  'Diploma / ITI',
  'Undergraduate',
  'Postgraduate & Above',
];
const EMPLOYMENT_OPTIONS: Array<Exclude<UserProfile['employmentStatus'], ''>> = [
  'Student',
  'Unemployed',
  'Self-Employed / Entrepreneur',
  'Salaried',
  'Farmer / Agricultural Worker',
  'Homemaker',
  'Retired / Senior Citizen',
];
const GENDER_OPTIONS: Array<Exclude<UserProfile['gender'], ''>> = ['Female', 'Male', 'Other', 'Prefer Not to Say'];
const SOCIAL_CATEGORY_OPTIONS: Array<Exclude<UserProfile['socialCategory'], ''>> = [
  'General',
  'OBC',
  'SC',
  'ST',
  'EWS',
  'Minority',
];

export function EligibilityCheckerPage() {
  const { user, loading: authLoading } = useAuth();
  const { language, t } = useLanguage();

  const [formProfile, setFormProfile] = useState<Partial<UserProfile>>({
    age: user?.profile.age ?? undefined,
    gender: user?.profile.gender ?? '',
    state: user?.profile.state ?? '',
    residence: user?.profile.residence ?? '',
    incomeRange: user?.profile.incomeRange ?? '',
    educationLevel: user?.profile.educationLevel ?? '',
    employmentStatus: user?.profile.employmentStatus ?? '',
    socialCategory: user?.profile.socialCategory ?? '',
    isFarmer: user?.profile.isFarmer ?? null,
    hasDisability: user?.profile.hasDisability ?? null,
  });

  const [evalData, setEvalData] = useState<EvaluateResponse | null>(null);
  const [filterTab, setFilterTab] = useState<'All' | EligibilityClassification>('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedKeyRef = useRef<string | null>(null);
  const formProfileRef = useRef(formProfile);
  formProfileRef.current = formProfile;

  const runEvaluation = async (profileToUse: Partial<UserProfile>, langToUse = language) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<EvaluateResponse>('/api/schemes/eligibility/evaluate', {
        method: 'POST',
        body: JSON.stringify({ profile: profileToUse, language: langToUse }),
      });
      setEvalData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    const authKey = user?.id ?? 'anon';
    if (initializedKeyRef.current !== authKey) {
      initializedKeyRef.current = authKey;
      const initialProfile = user?.profile || {};
      setFormProfile(initialProfile);
      runEvaluation(initialProfile, language);
      return;
    }
    runEvaluation(formProfileRef.current, language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runEvaluation(formProfile, language);
  };

  const filteredResults =
    evalData?.results.filter((r) => (filterTab === 'All' ? true : r.classification === filterTab)) || [];

  const Content = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">{t.eligibility.title}</h2>
          <p className="mt-1 text-sm text-[#465362] dark:text-[#A9B4C2]">{t.eligibility.subtitle}</p>
        </div>
        {user && (
          <button
            type="button"
            onClick={() => {
              setFormProfile(user.profile);
              runEvaluation(user.profile, language);
            }}
            className="rounded-xl border border-[#E6E1D6] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#FAF8F4] dark:border-[#1F2E42] dark:bg-[#111C2B]"
          >
            {t.eligibility.useSavedProfile}
          </button>
        )}
      </div>

      {/* Interactive Deterministic Criteria Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[#E6E1D6] bg-white p-5 sm:p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="elig-age" className="block text-xs font-semibold">
              {t.eligibility.ageYearsLabel}
            </label>
            <input
              id="elig-age"
              type="number"
              min={0}
              max={120}
              value={formProfile.age ?? ''}
              onChange={(e) =>
                setFormProfile((p) => ({
                  ...p,
                  age: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
              placeholder={t.eligibility.agePlaceholder}
              className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm tabular-nums dark:border-[#1F2E42] dark:bg-[#0A121C]"
            />
          </div>

          <div>
            <label htmlFor="elig-state" className="block text-xs font-semibold">
              {t.eligibility.stateUtLabel}
            </label>
            <select
              id="elig-state"
              value={formProfile.state || ''}
              onChange={(e) => setFormProfile((p) => ({ ...p, state: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
            >
              <option value="">{t.eligibility.selectStateOptional}</option>
              {INDIAN_STATES_AND_UTS.map((s) => (
                <option key={s} value={s}>
                  {translateState(s, language)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="elig-residence" className="block text-xs font-semibold">
              {t.eligibility.residenceAreaLabel}
            </label>
            <select
              id="elig-residence"
              value={formProfile.residence || ''}
              onChange={(e) => setFormProfile((p) => ({ ...p, residence: e.target.value as UserProfile['residence'] }))}
              className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
            >
              <option value="">{t.eligibility.selectOptional}</option>
              {RESIDENCE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {translateResidence(r, language)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="elig-income" className="block text-xs font-semibold">
              {t.eligibility.annualIncomeLabel}
            </label>
            <select
              id="elig-income"
              value={formProfile.incomeRange || ''}
              onChange={(e) =>
                setFormProfile((p) => ({ ...p, incomeRange: e.target.value as UserProfile['incomeRange'] }))
              }
              className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
            >
              <option value="">{t.eligibility.selectOptional}</option>
              {INCOME_OPTIONS.map((inc) => (
                <option key={inc} value={inc}>
                  {translateIncomeRange(inc, language)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="elig-edu" className="block text-xs font-semibold">
              {t.eligibility.educationLevelLabel}
            </label>
            <select
              id="elig-edu"
              value={formProfile.educationLevel || ''}
              onChange={(e) =>
                setFormProfile((p) => ({ ...p, educationLevel: e.target.value as UserProfile['educationLevel'] }))
              }
              className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
            >
              <option value="">{t.eligibility.selectOptional}</option>
              {EDUCATION_OPTIONS.map((edu) => (
                <option key={edu} value={edu}>
                  {translateEducationLevel(edu, language)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="elig-emp" className="block text-xs font-semibold">
              {t.eligibility.employmentStatusLabel}
            </label>
            <select
              id="elig-emp"
              value={formProfile.employmentStatus || ''}
              onChange={(e) =>
                setFormProfile((p) => ({ ...p, employmentStatus: e.target.value as UserProfile['employmentStatus'] }))
              }
              className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
            >
              <option value="">{t.eligibility.selectOptional}</option>
              {EMPLOYMENT_OPTIONS.map((emp) => (
                <option key={emp} value={emp}>
                  {translateEmploymentStatus(emp, language)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="elig-gender" className="block text-xs font-semibold">
              {t.eligibility.genderLabel}
            </label>
            <select
              id="elig-gender"
              value={formProfile.gender || ''}
              onChange={(e) =>
                setFormProfile((p) => ({ ...p, gender: e.target.value as UserProfile['gender'] }))
              }
              className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
            >
              <option value="">{t.eligibility.selectOptional}</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {translateGender(g, language)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="elig-cat" className="block text-xs font-semibold">
              {t.eligibility.socialCategoryOptionalLabel}
            </label>
            <select
              id="elig-cat"
              value={formProfile.socialCategory || ''}
              onChange={(e) =>
                setFormProfile((p) => ({ ...p, socialCategory: e.target.value as UserProfile['socialCategory'] }))
              }
              className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
            >
              <option value="">{t.eligibility.preferNotToSaySkip}</option>
              {SOCIAL_CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {translateSocialCategory(cat, language)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#E6E1D6] pt-4 dark:border-[#1F2E42]">
          <div className="flex flex-wrap gap-5 text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formProfile.isFarmer === true}
                onChange={(e) => setFormProfile((p) => ({ ...p, isFarmer: e.target.checked ? true : null }))}
                className="h-4 w-4 rounded accent-[#0F1D2E]"
              />
              <span>{t.eligibility.landholdingFarmerLabel}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formProfile.hasDisability === true}
                onChange={(e) => setFormProfile((p) => ({ ...p, hasDisability: e.target.checked ? true : null }))}
                className="h-4 w-4 rounded accent-[#0F1D2E]"
              />
              <span>{t.eligibility.disabilityOptionalLabel}</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#0F1D2E] px-5 py-2.5 text-xs font-semibold text-[#FAF8F4] hover:bg-[#1C304A] disabled:opacity-60 dark:bg-[#CBB07A] dark:text-[#0A121C]"
          >
            {loading ? t.common.loading : t.eligibility.runCheck}
          </button>
        </div>
      </form>

      {error && <ErrorBanner message={error} onRetry={() => runEvaluation(formProfile, language)} />}

      {/* Summary Bar + Segmented Tabs */}
      {evalData && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-xl bg-[#EFECE4] p-1 dark:bg-[#111C2B]">
            {(
              [
                { key: 'All', label: `${t.eligibility.allTab} (${evalData.results.length})` },
                { key: 'Likely Eligible', label: `${t.eligibility.likelyEligible} (${evalData.summary.likelyEligible})` },
                { key: 'Potentially Eligible', label: `${t.eligibility.potentiallyEligible} (${evalData.summary.potentiallyEligible})` },
                { key: 'Not Currently Eligible', label: `${t.eligibility.notEligible} (${evalData.summary.notCurrentlyEligible})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterTab(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors tabular-nums whitespace-nowrap ${
                  filterTab === tab.key
                    ? 'bg-white text-[#0F1D2E] shadow-xs dark:bg-[#1C2D42] dark:text-[#F4F1EA]'
                    : 'text-[#5B6777] hover:text-[#0F1D2E] dark:text-[#A9B4C2]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#8E9BAE]">{t.eligibility.disclaimer}</p>
        </div>
      )}

      {/* Results List */}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="space-y-4">
          {filteredResults.map((res) => (
            <article
              key={res.schemeId}
              className="rounded-2xl border border-[#E6E1D6] bg-white p-5 sm:p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/schemes/${res.schemeId}`}
                    className="font-display text-lg font-semibold text-[#0F1D2E] hover:text-[#1F6F78] dark:text-[#F4F1EA] dark:hover:text-[#CBB07A]"
                  >
                    {res.schemeName}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5B6777] dark:text-[#A9B4C2]">
                    <EligibilityStatusText classification={res.classification} />
                    <span>·</span>
                    <span>{translateVerificationStatus(res.verificationStatus, language)}</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">
                      {t.eligibility.verifiedPrefix} {res.lastVerifiedDate}
                    </span>
                  </div>
                </div>

                <a
                  href={res.officialSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1F6F78] hover:underline dark:text-[#CBB07A]"
                >
                  <span>{t.schemes.officialSource}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <p className="mt-3 text-sm text-[#465362] dark:text-[#A9B4C2]">{res.reason}</p>

              <div className="mt-4 grid gap-4 border-t border-[#E6E1D6] pt-4 md:grid-cols-3 dark:border-[#1F2E42]">
                <div>
                  <p className="text-xs font-semibold text-[#1F6F78] dark:text-[#4BB8C4]">{t.eligibility.satisfied}</p>
                  <ul className="mt-1.5 space-y-1 text-xs text-[#465362] dark:text-[#A9B4C2]">
                    {res.conditionsSatisfied.length === 0 ? (
                      <li>{t.eligibility.noneYet}</li>
                    ) : (
                      res.conditionsSatisfied.map((c) => (
                        <li key={c} className="flex items-start gap-1.5">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1F6F78]" />
                          <span>{c}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#9A712A] dark:text-[#D7B673]">{t.eligibility.missingInfo}</p>
                  <ul className="mt-1.5 space-y-1 text-xs text-[#465362] dark:text-[#A9B4C2]">
                    {res.missingInformation.length === 0 ? (
                      <li>{t.eligibility.none}</li>
                    ) : (
                      res.missingInformation.map((m) => (
                        <li key={m} className="flex items-start gap-1.5">
                          <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9A712A]" />
                          <span>{m}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#9E3B3B] dark:text-[#E58A8A]">{t.eligibility.notSatisfied}</p>
                  <ul className="mt-1.5 space-y-1 text-xs text-[#465362] dark:text-[#A9B4C2]">
                    {res.conditionsNotSatisfied.length === 0 ? (
                      <li>{t.eligibility.none}</li>
                    ) : (
                      res.conditionsNotSatisfied.map((f) => (
                        <li key={f} className="flex items-start gap-1.5">
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9E3B3B]" />
                          <span>{f}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E6E1D6] pt-3 text-xs dark:border-[#1F2E42]">
                <span className="text-[#465362] dark:text-[#A9B4C2]">
                  <strong>{t.eligibility.nextAction}:</strong> {res.nextRecommendedAction}
                </span>
                <Link
                  to={`/schemes/${res.schemeId}`}
                  className="font-semibold text-[#0F1D2E] hover:text-[#1F6F78] dark:text-[#F4F1EA] dark:hover:text-[#CBB07A]"
                >
                  {t.schemes.viewDetails} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  if (user) {
    return <DashboardLayout title={t.nav.eligibilityChecker}>{Content}</DashboardLayout>;
  }
  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">{Content}</div>
    </PublicLayout>
  );
}
