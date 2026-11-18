import React, { useCallback, useEffect, useState } from 'react';
import { Archive, CheckCircle, Plus } from 'lucide-react';
import {
  SCHEME_CATEGORIES,
  type AdminAuditLogRecord,
  type FeedbackRecord,
  type GovernmentScheme,
  type VerificationStatus,
} from '../../../backend/types/index.ts';
import { ErrorBanner, LoadingSkeleton } from '../components/UiPrimitives.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { DashboardLayout } from '../layouts/DashboardLayout.tsx';
import { apiRequest } from '../services/api.ts';
import {
  translateCategory,
  translateClassification,
  translateFeedbackCategory,
  translateFeedbackStatus,
  translateState,
  translateVerificationStatus,
} from '../translations/domainLabels.ts';

const VERIFICATION_STATUS_OPTIONS: VerificationStatus[] = [
  'Draft',
  'Verification Required',
  'Verified',
  'Needs Review',
  'Archived',
];

export function AdminDashboardPage() {
  const { language, t, localizeScheme } = useLanguage();
  const [tab, setTab] = useState<'schemes' | 'feedback' | 'audit'>('schemes');
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newState, setNewState] = useState('All India');
  const [newClass, setNewClass] = useState<'Central' | 'State'>('Central');
  const [newSourceUrl, setNewSourceUrl] = useState('https://www.myscheme.gov.in/');
  const [newAppUrl, setNewAppUrl] = useState('https://www.myscheme.gov.in/');
  const [newCategory, setNewCategory] = useState<(typeof SCHEME_CATEGORIES)[number]>(SCHEME_CATEGORIES[0]);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, fRes, aRes] = await Promise.all([
        apiRequest<{ items: GovernmentScheme[] }>('/api/admin/schemes'),
        apiRequest<{ items: FeedbackRecord[] }>('/api/admin/feedback'),
        apiRequest<{ items: AdminAuditLogRecord[] }>('/api/admin/audit-logs'),
      ]);
      setSchemes(sRes.items);
      setFeedback(fRes.items);
      setAuditLogs(aRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [t.common.errorGeneric]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const updateSchemeVerification = async (id: string, verificationStatus: VerificationStatus) => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await apiRequest<{ item: GovernmentScheme }>(`/api/admin/schemes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ verificationStatus, lastVerifiedDate: today }),
    });
    setSchemes((prev) => prev.map((s) => (s.id === id ? res.item : s)));
    loadAdminData();
  };

  const archiveScheme = async (id: string) => {
    const res = await apiRequest<{ item: GovernmentScheme }>(`/api/admin/schemes/${id}/archive`, {
      method: 'POST',
    });
    setSchemes((prev) => prev.map((s) => (s.id === id ? res.item : s)));
    loadAdminData();
  };

  const createScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/api/admin/schemes', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          shortCode: newCode,
          officialDescription: newDesc,
          department: newDept,
          classification: newClass,
          applicableState: newState,
          categories: [newCategory],
          targetBeneficiaries: ['Eligible Citizens'],
          eligibilityRequirementsSummary: ['Verify detailed eligibility criteria on official portal.'],
          benefits: ['Refer official notification for current grant amount.'],
          requiredDocuments: ['Identity Proof', 'Residence Proof', 'Bank Passbook'],
          applicationProcedure: ['Apply through official government portal.'],
          officialApplicationUrl: newAppUrl,
          officialSourceUrl: newSourceUrl,
          lastVerifiedDate: new Date().toISOString().slice(0, 10),
          verificationStatus: 'Verification Required',
          criteria: {
            allowedStates: [newState],
            allowedResidences: [],
          },
        }),
      });
      setShowNewForm(false);
      setNewName('');
      setNewCode('');
      setNewDept('');
      setNewDesc('');
      loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    }
  };

  const resolveFeedback = async (id: string, status: 'Reviewed' | 'Resolved') => {
    await apiRequest(`/api/admin/feedback/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    loadAdminData();
  };

  return (
    <DashboardLayout title={t.nav.adminConsole}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">{t.admin.title}</h2>
            <p className="mt-1 text-sm text-[#465362] dark:text-[#A9B4C2]">{t.admin.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F1D2E] px-4 py-2.5 text-xs font-semibold text-[#FAF8F4] dark:bg-[#CBB07A] dark:text-[#0A121C]"
          >
            <Plus className="h-4 w-4" />
            <span>{t.admin.addSchemeBtn}</span>
          </button>
        </div>

        {error && <ErrorBanner message={error} onRetry={loadAdminData} />}

        {showNewForm && (
          <form
            onSubmit={createScheme}
            className="space-y-4 rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]"
          >
            <h3 className="font-display text-base font-semibold">{t.admin.createSchemeHeading}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <input
                type="text"
                required
                placeholder={t.admin.namePlaceholder}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
              <input
                type="text"
                required
                placeholder={t.admin.shortCodePlaceholder}
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
              <input
                type="text"
                required
                placeholder={t.admin.deptPlaceholder}
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
              <select
                value={newClass}
                onChange={(e) => setNewClass(e.target.value as 'Central' | 'State')}
                className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                <option value="Central">{translateClassification('Central', language)}</option>
                <option value="State">{translateClassification('State', language)}</option>
              </select>
              <input
                type="text"
                required
                placeholder={t.admin.statePlaceholder}
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as (typeof SCHEME_CATEGORIES)[number])}
                className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                {SCHEME_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {translateCategory(c, language)}
                  </option>
                ))}
              </select>
              <input
                type="url"
                required
                placeholder={t.admin.sourceUrlPlaceholder}
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
              <input
                type="url"
                required
                placeholder={t.admin.appUrlPlaceholder}
                value={newAppUrl}
                onChange={(e) => setNewAppUrl(e.target.value)}
                className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
            </div>
            <textarea
              required
              rows={3}
              placeholder={t.admin.descPlaceholder}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowNewForm(false)} className="rounded-xl border border-[#E6E1D6] px-4 py-2 text-xs">
                {t.common.cancel}
              </button>
              <button type="submit" className="rounded-xl bg-[#0F1D2E] px-5 py-2 text-xs font-semibold text-[#FAF8F4] dark:bg-[#CBB07A] dark:text-[#0A121C]">
                {t.admin.saveSchemeBtn}
              </button>
            </div>
          </form>
        )}

        {/* Section Tabs */}
        <div className="flex gap-1 rounded-xl bg-[#EFECE4] p-1 w-fit dark:bg-[#111C2B]">
          {(
            [
              ['schemes', `${t.admin.tabSchemes} (${schemes.length})`],
              ['feedback', `${t.admin.tabFeedback} (${feedback.length})`],
              ['audit', `${t.admin.tabAudit} (${auditLogs.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold ${
                tab === key ? 'bg-white text-[#0F1D2E] shadow-xs dark:bg-[#1C2D42] dark:text-[#F4F1EA]' : 'text-[#5B6777]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : tab === 'schemes' ? (
          <div className="overflow-x-auto rounded-2xl border border-[#E6E1D6] bg-white dark:border-[#1F2E42] dark:bg-[#111C2B]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E6E1D6] bg-[#FAF8F4] dark:border-[#1F2E42] dark:bg-[#0E1826]">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t.admin.colScheme}</th>
                  <th className="px-4 py-3 font-semibold">{t.admin.colState}</th>
                  <th className="px-4 py-3 font-semibold">{t.admin.colVerifiedDate}</th>
                  <th className="px-4 py-3 font-semibold">{t.admin.colStatus}</th>
                  <th className="px-4 py-3 font-semibold">{t.admin.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E1D6] dark:divide-[#1F2E42]">
                {schemes.map((s) => {
                  const loc = localizeScheme(s);
                  return (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-medium">{loc.name}</td>
                      <td className="px-4 py-3">{translateState(loc.applicableState, language)}</td>
                      <td className="px-4 py-3 font-mono tabular-nums">{loc.lastVerifiedDate}</td>
                      <td className="px-4 py-3">
                        <select
                          aria-label={`${t.admin.colStatus}: ${loc.shortCode}`}
                          value={s.verificationStatus}
                          onChange={(e) => updateSchemeVerification(s.id, e.target.value as VerificationStatus)}
                          className="rounded-lg border border-[#E6E1D6] bg-[#FAF8F4] px-2 py-1 text-xs dark:border-[#1F2E42] dark:bg-[#0A121C]"
                        >
                          {VERIFICATION_STATUS_OPTIONS.map((vs) => (
                            <option key={vs} value={vs}>
                              {translateVerificationStatus(vs, language)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => archiveScheme(s.id)}
                          className="inline-flex items-center gap-1 text-xs text-[#9E3B3B] hover:underline"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          <span>{t.admin.archiveBtn}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : tab === 'feedback' ? (
          <div className="space-y-3">
            {feedback.length === 0 ? (
              <p className="text-sm text-[#64748B]">{t.admin.emptyFeedback}</p>
            ) : (
              feedback.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E6E1D6] bg-white p-4 dark:border-[#1F2E42] dark:bg-[#111C2B]"
                >
                  <div>
                    <p className="text-xs font-semibold">
                      {translateFeedbackCategory(f.category, language)} ·{' '}
                      <span className="font-mono">{translateFeedbackStatus(f.status, language)}</span>
                    </p>
                    <p className="mt-1 text-sm">{f.message}</p>
                    <p className="mt-1 font-mono text-[11px] text-[#64748B]">{f.createdAt.slice(0, 10)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => resolveFeedback(f.id, 'Resolved')}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E6E1D6] px-3 py-1.5 text-xs font-semibold"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-[#3F6B56]" />
                      <span>{t.admin.markResolvedBtn}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-[#64748B]">{t.admin.emptyAuditLogs}</p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-[#E6E1D6] bg-white p-3.5 text-xs dark:border-[#1F2E42] dark:bg-[#111C2B]"
                >
                  <span className="font-mono font-semibold">{log.action}</span> · {log.details} ·{' '}
                  <span className="font-mono text-[#64748B]">
                    {log.adminEmail} ({log.createdAt.slice(0, 19)})
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
