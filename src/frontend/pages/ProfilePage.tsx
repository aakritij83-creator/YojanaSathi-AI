import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { INDIAN_STATES_AND_UTS } from '../../../backend/data/verifiedSchemes.ts';
import type { LanguageCode, UserProfile } from '../../../backend/types/index.ts';
import { ErrorBanner } from '../components/UiPrimitives.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { DashboardLayout } from '../layouts/DashboardLayout.tsx';
import { apiRequest } from '../services/api.ts';
import { LANGUAGE_OPTIONS } from '../translations/index.ts';

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const { setLanguage, t } = useLanguage();
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
                Age (Years)
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
                Date of Birth (Optional)
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
                Gender (Optional)
              </label>
              <select
                id="prof-gender"
                value={form.gender || ''}
                onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as UserProfile['gender'] }))}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">Skip / Not specified</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Prefer Not to Say">Prefer Not to Say</option>
              </select>
            </div>

            <div>
              <label htmlFor="prof-state" className="block text-xs font-semibold">
                State / Union Territory
              </label>
              <select
                id="prof-state"
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">Select state</option>
                {INDIAN_STATES_AND_UTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prof-district" className="block text-xs font-semibold">
                District (Optional)
              </label>
              <input
                id="prof-district"
                type="text"
                value={form.district}
                onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
                placeholder="e.g. Pune"
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
            </div>

            <div>
              <label htmlFor="prof-res" className="block text-xs font-semibold">
                Rural or Urban Residence
              </label>
              <select
                id="prof-res"
                value={form.residence}
                onChange={(e) => setForm((p) => ({ ...p, residence: e.target.value as UserProfile['residence'] }))}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">Skip / Not specified</option>
                <option value="Rural">Rural</option>
                <option value="Urban">Urban</option>
              </select>
            </div>

            <div>
              <label htmlFor="prof-inc" className="block text-xs font-semibold">
                Annual Household Income Range
              </label>
              <select
                id="prof-inc"
                value={form.incomeRange}
                onChange={(e) => setForm((p) => ({ ...p, incomeRange: e.target.value as UserProfile['incomeRange'] }))}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">Skip / Not specified</option>
                <option value="Below ₹1,00,000">Below ₹1,00,000</option>
                <option value="₹1,00,000 – ₹2,50,000">₹1,00,000 – ₹2,50,000</option>
                <option value="₹2,50,000 – ₹5,00,000">₹2,50,000 – ₹5,00,000</option>
                <option value="₹5,00,000 – ₹8,00,000">₹5,00,000 – ₹8,00,000</option>
                <option value="Above ₹8,00,000">Above ₹8,00,000</option>
              </select>
            </div>

            <div>
              <label htmlFor="prof-cat" className="block text-xs font-semibold">
                Social Category (Voluntary)
              </label>
              <select
                id="prof-cat"
                value={form.socialCategory}
                onChange={(e) =>
                  setForm((p) => ({ ...p, socialCategory: e.target.value as UserProfile['socialCategory'] }))
                }
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">Prefer Not to Say / Skip</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
                <option value="Minority">Minority</option>
              </select>
            </div>

            <div>
              <label htmlFor="prof-edu" className="block text-xs font-semibold">
                Education Level
              </label>
              <select
                id="prof-edu"
                value={form.educationLevel}
                onChange={(e) =>
                  setForm((p) => ({ ...p, educationLevel: e.target.value as UserProfile['educationLevel'] }))
                }
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">Skip / Not specified</option>
                <option value="No Formal Education">No Formal Education</option>
                <option value="Primary / Secondary (Up to Class 10)">Primary / Secondary (Up to Class 10)</option>
                <option value="Higher Secondary (Class 12)">Higher Secondary (Class 12)</option>
                <option value="Diploma / ITI">Diploma / ITI</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate & Above">Postgraduate &amp; Above</option>
              </select>
            </div>

            <div>
              <label htmlFor="prof-course" className="block text-xs font-semibold">
                Current Course (If Student, Optional)
              </label>
              <input
                id="prof-course"
                type="text"
                value={form.currentCourse}
                onChange={(e) => setForm((p) => ({ ...p, currentCourse: e.target.value }))}
                placeholder="e.g. B.Tech Computer Science"
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
            </div>

            <div>
              <label htmlFor="prof-emp" className="block text-xs font-semibold">
                Employment Status
              </label>
              <select
                id="prof-emp"
                value={form.employmentStatus}
                onChange={(e) =>
                  setForm((p) => ({ ...p, employmentStatus: e.target.value as UserProfile['employmentStatus'] }))
                }
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">Skip / Not specified</option>
                <option value="Student">Student</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Self-Employed / Entrepreneur">Self-Employed / Entrepreneur</option>
                <option value="Salaried">Salaried</option>
                <option value="Farmer / Agricultural Worker">Farmer / Agricultural Worker</option>
                <option value="Homemaker">Homemaker</option>
                <option value="Retired / Senior Citizen">Retired / Senior Citizen</option>
              </select>
            </div>

            <div>
              <label htmlFor="prof-occ" className="block text-xs font-semibold">
                Occupation (Optional)
              </label>
              <input
                id="prof-occ"
                type="text"
                value={form.occupation}
                onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))}
                placeholder="e.g. Tailor, Small Farmer"
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
              <p className="text-xs font-semibold">Farmer Status (Optional)</p>
              <select
                aria-label="Farmer Status"
                value={form.isFarmer === null || form.isFarmer === undefined ? '' : form.isFarmer ? 'yes' : 'no'}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    isFarmer: e.target.value === '' ? null : e.target.value === 'yes',
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="">Skip / Not specified</option>
                <option value="yes">Yes, landholding or cultivating farmer</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <p className="text-xs font-semibold">Disability Eligibility Info (Voluntary)</p>
              <select
                aria-label="Disability Status"
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
                <option value="">Prefer Not to Say / Skip</option>
                <option value="yes">Yes (40%+ certified benchmark disability)</option>
                <option value="no">No</option>
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
