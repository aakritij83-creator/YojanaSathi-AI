import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { INDIAN_STATES_AND_UTS } from '../../../backend/data/verifiedSchemes.ts';
import type { LanguageCode, UserProfile } from '../../../backend/types/index.ts';
import { ErrorBanner } from '../components/UiPrimitives.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { DashboardLayout } from '../layouts/DashboardLayout.tsx';
import { apiRequest } from '../services/api.ts';
import {
  translateEducationLevel,
  translateEmploymentStatus,
  translateGender,
  translateIncomeRange,
  translateResidence,
  translateSocialCategory,
  translateState,
} from '../translations/domainLabels.ts';
import { LANGUAGE_OPTIONS } from '../translations/index.ts';

const GENDER_OPTIONS: Array<NonNullable<Exclude<UserProfile['gender'], ''>>> = [
  'Female',
  'Male',
  'Other',
  'Prefer Not to Say',
];
const RESIDENCE_OPTIONS: Array<NonNullable<Exclude<UserProfile['residence'], ''>>> = ['Rural', 'Urban'];
const INCOME_OPTIONS: Array<NonNullable<Exclude<UserProfile['incomeRange'], ''>>> = [
  'Below ₹1,00,000',
  '₹1,00,000 – ₹2,50,000',
  '₹2,50,000 – ₹5,00,000',
  '₹5,00,000 – ₹8,00,000',
  'Above ₹8,00,000',
];
const SOCIAL_CATEGORY_OPTIONS: Array<NonNullable<Exclude<UserProfile['socialCategory'], ''>>> = [
  'General',
  'OBC',
  'SC',
  'ST',
  'EWS',
  'Minority',
];
const EDUCATION_OPTIONS: Array<NonNullable<Exclude<UserProfile['educationLevel'], ''>>> = [
  'No Formal Education',
  'Primary / Secondary (Up to Class 10)',
  'Higher Secondary (Class 12)',
  'Diploma / ITI',
  'Undergraduate',
  'Postgraduate & Above',
];
const EMPLOYMENT_OPTIONS: Array<NonNullable<Exclude<UserProfile['employmentStatus'], ''>>> = [
  'Student',
  'Unemployed',
  'Self-Employed / Entrepreneur',
  'Salaried',
  'Farmer / Agricultural Worker',
  'Homemaker',
  'Retired / Senior Citizen',
];

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [form, setForm] = useState<UserProfile>(() => ({
    fullName: user?.profile.fullName || '',
    age: user?.profile.age ?? null,
    dateOfBirth: user?.profile.dateOfBirth || '',
    gender: user?.profile.gender || '',
    state: user?.profile.state || '',
    district: user?.profile.district || '',
    residence: user?.profile.residence || '',
    incomeRange: user?.profile.incomeRange || '',
    socialCategory: user?.profile.socialCategory || '',
    educationLevel: user?.profile.educationLevel || '',
    currentCourse: user?.profile.currentCourse || '',
    employmentStatus: user?.profile.employmentStatus || '',
    occupation: user?.profile.occupation || '',
    isFarmer: user?.profile.isFarmer ?? null,
    hasDisability: user?.profile.hasDisability ?? null,
    disabilityDetails: user?.profile.disabilityDetails || '',
    preferredLanguage: user?.profile.preferredLanguage || 'en',
    updatedAt: user?.profile.updatedAt || '',
  }));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedNotice(false);
    try {
      const res = await apiRequest<{ user: typeof user }>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      if (res.user) {
        setUser(res.user);
        setLanguage(res.user.preferredLanguage);
      }
      setSavedNotice(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title={t.nav.myProfile}>
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold">{t.profile.title}</h2>
          <p className="mt-1 text-sm text-[#465362] dark:text-[#A9B4C2]">{t.profile.subtitle}</p>
        </div>

        <div className="flex items-start gap-2.5 rounded-2xl border border-[#E6E1D6] bg-white p-4 text-xs text-[#465362] dark:border-[#1F2E42] dark:bg-[#111C2B] dark:text-[#A9B4C2]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#5F7F6E]" />
          <span>{t.profile.whyOptional}</span>
        </div>

        {error && <ErrorBanner message={error} />}
        {savedNotice && (
          <div className="rounded-xl border border-[#3F6B56]/30 bg-[#3F6B56]/10 px-4 py-3 text-xs font-semibold text-[#2E5240] dark:text-[#8CC0A5]">
            {t.profile.savedSuccess}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-semibold">
                {t.auth.fullName} *
              </label>
              <input
                id="prof-name"
                type="text"
                required
                minLength={2}
                value={form.fullName}
                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
            </div>

            <div>
              <label htmlFor="prof-age" className="block text-xs font-semibold">
                {t.profile.ageYearsLabel}
              </label>
              <input
                id="prof-age"
                type="number"
                min={0}
                max={120}
                value={form.age ?? ''}
                onChange={(e) =>
                  setForm((p) => ({ ...p, age: e.target.value === '' ? null : Number(e.target.value) }))
                }
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm tabular-nums dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
            </div>

            <div>
              <label htmlFor="prof-dob" className="block text-xs font-semibold">
                {t.profile.dobOptionalLabel}
              </label>
              <input
                id="prof-dob"
                type="date"
                value={form.dateOfBirth || ''}
                onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
            </div>

            <div>
              <label htmlFor="prof-gender" className="block text-xs font-semibold">
                {t.profile.genderOptionalLabel}
              </label>
              <select
                id="prof-gender"
                value={form.gender || ''}
                onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as UserProfile['gender'] }))}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">{t.profile.skipNotSpecified}</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {translateGender(g, language)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prof-state" className="block text-xs font-semibold">
                {t.profile.stateUtLabel}
              </label>
              <select
                id="prof-state"
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">{t.profile.selectState}</option>
                {INDIAN_STATES_AND_UTS.map((s) => (
                  <option key={s} value={s}>
                    {translateState(s, language)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prof-district" className="block text-xs font-semibold">
                {t.profile.districtOptionalLabel}
              </label>
              <input
                id="prof-district"
                type="text"
                value={form.district}
                onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
                placeholder={t.profile.districtPlaceholder}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
            </div>

            <div>
              <label htmlFor="prof-res" className="block text-xs font-semibold">
                {t.profile.residenceLabel}
              </label>
              <select
                id="prof-res"
                value={form.residence}
                onChange={(e) => setForm((p) => ({ ...p, residence: e.target.value as UserProfile['residence'] }))}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">{t.profile.skipNotSpecified}</option>
                {RESIDENCE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {translateResidence(r, language)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prof-inc" className="block text-xs font-semibold">
                {t.profile.incomeRangeLabel}
              </label>
              <select
                id="prof-inc"
                value={form.incomeRange}
                onChange={(e) => setForm((p) => ({ ...p, incomeRange: e.target.value as UserProfile['incomeRange'] }))}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">{t.profile.skipNotSpecified}</option>
                {INCOME_OPTIONS.map((inc) => (
                  <option key={inc} value={inc}>
                    {translateIncomeRange(inc, language)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prof-cat" className="block text-xs font-semibold">
                {t.profile.socialCategoryVoluntaryLabel}
              </label>
              <select
                id="prof-cat"
                value={form.socialCategory}
                onChange={(e) =>
                  setForm((p) => ({ ...p, socialCategory: e.target.value as UserProfile['socialCategory'] }))
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

            <div>
              <label htmlFor="prof-edu" className="block text-xs font-semibold">
                {t.profile.educationLevelLabel}
              </label>
              <select
                id="prof-edu"
                value={form.educationLevel}
                onChange={(e) =>
                  setForm((p) => ({ ...p, educationLevel: e.target.value as UserProfile['educationLevel'] }))
                }
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">{t.profile.skipNotSpecified}</option>
                {EDUCATION_OPTIONS.map((edu) => (
                  <option key={edu} value={edu}>
                    {translateEducationLevel(edu, language)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prof-course" className="block text-xs font-semibold">
                {t.profile.currentCourseOptionalLabel}
              </label>
              <input
                id="prof-course"
                type="text"
                value={form.currentCourse}
                onChange={(e) => setForm((p) => ({ ...p, currentCourse: e.target.value }))}
                placeholder={t.profile.coursePlaceholder}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
            </div>

            <div>
              <label htmlFor="prof-emp" className="block text-xs font-semibold">
                {t.profile.employmentStatusLabel}
              </label>
              <select
                id="prof-emp"
                value={form.employmentStatus}
                onChange={(e) =>
                  setForm((p) => ({ ...p, employmentStatus: e.target.value as UserProfile['employmentStatus'] }))
                }
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">{t.profile.skipNotSpecified}</option>
                {EMPLOYMENT_OPTIONS.map((emp) => (
                  <option key={emp} value={emp}>
                    {translateEmploymentStatus(emp, language)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prof-occ" className="block text-xs font-semibold">
                {t.profile.occupationOptionalLabel}
              </label>
              <input
                id="prof-occ"
                type="text"
                value={form.occupation}
                onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))}
                placeholder={t.profile.occupationPlaceholder}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
            </div>

            <div>
              <label htmlFor="prof-lang" className="block text-xs font-semibold">
                {t.auth.preferredLanguage}
              </label>
              <select
                id="prof-lang"
                value={form.preferredLanguage}
                onChange={(e) => setForm((p) => ({ ...p, preferredLanguage: e.target.value as LanguageCode }))}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label} ({opt.nativeLabel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 border-t border-[#E6E1D6] pt-4 sm:grid-cols-2 dark:border-[#1F2E42]">
            <div>
              <p className="text-xs font-semibold">{t.profile.farmerStatusOptionalLabel}</p>
              <select
                aria-label={t.profile.farmerStatusOptionalLabel}
                value={form.isFarmer === null || form.isFarmer === undefined ? '' : form.isFarmer ? 'yes' : 'no'}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    isFarmer: e.target.value === '' ? null : e.target.value === 'yes',
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">{t.profile.skipNotSpecified}</option>
                <option value="yes">{t.profile.farmerYesOption}</option>
                <option value="no">{t.profile.noOption}</option>
              </select>
            </div>

            <div>
              <p className="text-xs font-semibold">{t.profile.disabilityInfoVoluntaryLabel}</p>
              <select
                aria-label={t.profile.disabilityInfoVoluntaryLabel}
                value={
                  form.hasDisability === null || form.hasDisability === undefined
                    ? ''
                    : form.hasDisability
                      ? 'yes'
                      : 'no'
                }
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    hasDisability: e.target.value === '' ? null : e.target.value === 'yes',
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">{t.eligibility.preferNotToSaySkip}</option>
                <option value="yes">{t.profile.disabilityYesOption}</option>
                <option value="no">{t.profile.noOption}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end border-t border-[#E6E1D6] pt-4 dark:border-[#1F2E42]">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#0F1D2E] px-6 py-2.5 text-sm font-semibold text-[#FAF8F4] disabled:opacity-60 dark:bg-[#CBB07A] dark:text-[#0A121C]"
            >
              {saving ? t.profile.saving : t.profile.saveProfile}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
