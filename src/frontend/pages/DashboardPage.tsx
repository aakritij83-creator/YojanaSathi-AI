import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type {
  ApplicationRecord,
  EligibilityResult,
  GovernmentScheme,
  NotificationRecord,
} from '../../../backend/types/index.ts';
import { EligibilityStatusText, ErrorBanner, LoadingSkeleton } from '../components/UiPrimitives.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { DashboardLayout } from '../layouts/DashboardLayout.tsx';
import { apiRequest } from '../services/api.ts';
import { localizeSystemNotification, translateState } from '../translations/domainLabels.ts';

interface DashboardData {
  metrics: {
    matchingSchemesCount: number;
    potentiallyEligibleCount: number;
    savedSchemesCount: number;
    applicationsInProgressCount: number;
    approvedApplicationsCount: number;
    unreadNotificationsCount: number;
  };
  profileCompletion: {
    percentage: number;
    completedCount: number;
    totalCount: number;
    missingCoreFields: string[];
  };
  recommendedSchemes: { scheme: GovernmentScheme; eligibility: EligibilityResult }[];
  recentlyViewed: GovernmentScheme[];
  upcomingDeadlines: GovernmentScheme[];
  pendingActions: { id: string; title: string; detail: string; href: string }[];
  recentNotifications: NotificationRecord[];
  applications: ApplicationRecord[];
  charts: {
    eligibilityChartData: { name: string; count: number }[];
    applicationStatusChart: { stage: string; count: number }[];
  };
}

export function DashboardPage() {
  const { user } = useAuth();
  const { language, t, localizeScheme } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<DashboardData>(`/api/dashboard?lang=${encodeURIComponent(language)}`);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [language, t.common.errorGeneric]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const userName = user?.profile.fullName || user?.email || t.dashboard.citizenFallback;

  const localizedEligibilityChartData = useMemo(() => {
    if (!data) return [];
    const labelMap: Record<string, string> = {
      'Likely Eligible': t.dashboard.chartLikelyEligible,
      'Potentially Eligible': t.dashboard.chartPotentiallyEligible,
      'Not Eligible': t.dashboard.chartNotEligible,
    };
    return data.charts.eligibilityChartData.map((item) => ({
      ...item,
      name: labelMap[item.name] || item.name,
    }));
  }, [data, t.dashboard]);

  const localizedStatusChartData = useMemo(() => {
    if (!data) return [];
    const stageMap: Record<string, string> = {
      Preparation: t.dashboard.chartPreparation,
      'Submitted / Review': t.dashboard.chartSubmittedReview,
      Approved: t.dashboard.chartApproved,
      'Closed / Rejected': t.dashboard.chartClosedRejected,
    };
    return data.charts.applicationStatusChart.map((item) => ({
      ...item,
      stage: stageMap[item.stage] || item.stage,
    }));
  }, [data, t.dashboard]);

  return (
    <DashboardLayout title={t.nav.dashboard}>
      <div className="space-y-6">
        {/* Personalized Greeting Header */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#0F1D2E] dark:text-[#F4F1EA]">
              {t.dashboard.welcomeBack}, {userName}!
            </h2>
            <p className="mt-1 text-sm text-[#465362] dark:text-[#A9B4C2]">
              {t.dashboard.overviewSubtitle}
            </p>
          </div>
          {data && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-medium text-[#5B6777] dark:text-[#A9B4C2]">
                  {t.dashboard.profileCompletion}
                </p>
                <p className="font-mono text-lg font-bold tabular-nums text-[#1F6F78] dark:text-[#CBB07A]">
                  {data.profileCompletion.percentage}%
                </p>
              </div>
              <Link
                to="/profile"
                className="rounded-xl bg-[#0F1D2E] px-4 py-2.5 text-xs font-semibold text-[#FAF8F4] hover:bg-[#1C304A] dark:bg-[#CBB07A] dark:text-[#0A121C]"
              >
                {t.dashboard.completeProfileCta}
              </Link>
            </div>
          )}
        </section>

        {error && <ErrorBanner message={error} onRetry={loadDashboard} />}

        {loading || !data ? (
          <LoadingSkeleton rows={4} />
        ) : (
          <>
            {/* Real Metrics Strip */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: t.dashboard.matchingSchemes, value: data.metrics.matchingSchemesCount, to: '/eligibility' },
                { label: t.dashboard.savedSchemes, value: data.metrics.savedSchemesCount, to: '/saved' },
                { label: t.dashboard.inProgress, value: data.metrics.applicationsInProgressCount, to: '/tracker' },
                { label: t.dashboard.approved, value: data.metrics.approvedApplicationsCount, to: '/tracker' },
              ].map((stat) => (
                <Link
                  key={stat.label}
                  to={stat.to}
                  className="rounded-2xl border border-[#E6E1D6] bg-white p-5 transition-colors hover:border-[#1F6F78] dark:border-[#1F2E42] dark:bg-[#111C2B] dark:hover:border-[#CBB07A]"
                >
                  <p className="text-xs font-medium text-[#5B6777] dark:text-[#A9B4C2]">{stat.label}</p>
                  <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-[#0F1D2E] dark:text-[#F4F1EA]">
                    {stat.value}
                  </p>
                </Link>
              ))}
            </section>

            {/* Recharts Analytics */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#E6E1D6] bg-white p-5 dark:border-[#1F2E42] dark:bg-[#111C2B]">
                <h3 className="font-display text-sm font-semibold text-[#0F1D2E] dark:text-[#F4F1EA]">
                  {t.dashboard.eligibilityBreakdown}
                </h3>
                <div className="mt-4 h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={localizedEligibilityChartData}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.18} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name={t.dashboard.chartCountLabel} fill="#1F6F78" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E6E1D6] bg-white p-5 dark:border-[#1F2E42] dark:bg-[#111C2B]">
                <h3 className="font-display text-sm font-semibold text-[#0F1D2E] dark:text-[#F4F1EA]">
                  {t.dashboard.applicationPipeline}
                </h3>
                {data.charts.applicationStatusChart.every((s) => s.count === 0) ? (
                  <div className="mt-4 flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-[#E6E1D6] bg-[#FAF8F4] px-6 text-center dark:border-[#1F2E42] dark:bg-[#0A121C]">
                    <p className="text-sm font-medium text-[#0F1D2E] dark:text-[#F4F1EA]">
                      {t.tracker.emptyTitle}
                    </p>
                    <Link
                      to="/schemes"
                      className="mt-3 text-xs font-semibold text-[#1F6F78] hover:underline dark:text-[#CBB07A]"
                    >
                      {t.nav.discoverSchemes} →
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4 h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={localizedStatusChartData}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.18} />
                        <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" name={t.dashboard.chartCountLabel} fill="#5F7F6E" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>

            {/* Recommended Schemes + Pending Actions */}
            <section className="grid gap-6 lg:grid-cols-12">
              <div className="rounded-2xl border border-[#E6E1D6] bg-white p-6 lg:col-span-7 dark:border-[#1F2E42] dark:bg-[#111C2B]">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold">{t.dashboard.recommendedTitle}</h3>
                  <Link to="/schemes" className="text-xs font-semibold text-[#1F6F78] hover:underline dark:text-[#CBB07A]">
                    {t.nav.discoverSchemes} →
                  </Link>
                </div>
                {data.recommendedSchemes.length === 0 ? (
                  <p className="mt-4 text-sm text-[#5B6777] dark:text-[#A9B4C2]">{t.dashboard.emptyRecommended}</p>
                ) : (
                  <div className="mt-4 divide-y divide-[#E6E1D6] dark:divide-[#1F2E42]">
                    {data.recommendedSchemes.map(({ scheme, eligibility }) => {
                      const locScheme = localizeScheme(scheme);
                      return (
                        <div key={scheme.id} className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                          <div>
                            <Link
                              to={`/schemes/${scheme.id}`}
                              className="text-sm font-semibold text-[#0F1D2E] hover:text-[#1F6F78] dark:text-[#F4F1EA] dark:hover:text-[#CBB07A]"
                            >
                              {locScheme.name}
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <EligibilityStatusText classification={eligibility.classification} />
                              <span className="text-xs text-[#64748B]">
                                · {translateState(locScheme.applicableState, language)}
                              </span>
                            </div>
                          </div>
                          <Link
                            to={`/schemes/${scheme.id}`}
                            aria-label={`${t.schemes.viewDetails}: ${locScheme.name}`}
                            className="shrink-0 text-xs font-semibold text-[#1F6F78] dark:text-[#CBB07A]"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#E6E1D6] bg-white p-6 lg:col-span-5 dark:border-[#1F2E42] dark:bg-[#111C2B]">
                <h3 className="font-display text-base font-semibold">{t.dashboard.pendingActionsTitle}</h3>
                {data.pendingActions.length === 0 ? (
                  <p className="mt-4 text-sm text-[#5B6777] dark:text-[#A9B4C2]">{t.dashboard.emptyActions}</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {data.pendingActions.map((act) => (
                      <li key={act.id}>
                        <Link
                          to={act.href}
                          className="block rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] p-3.5 transition-colors hover:border-[#1F6F78] dark:border-[#1F2E42] dark:bg-[#0A121C]"
                        >
                          <p className="flex items-center gap-2 text-xs font-semibold text-[#0F1D2E] dark:text-[#F4F1EA]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#1F6F78] dark:text-[#CBB07A]" />
                            <span>{act.title}</span>
                          </p>
                          <p className="mt-1 text-xs text-[#5B6777] dark:text-[#A9B4C2]">{act.detail}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Recently Viewed, Deadlines, Notifications */}
            <section className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-[#E6E1D6] bg-white p-5 dark:border-[#1F2E42] dark:bg-[#111C2B]">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
                  <Clock className="h-4 w-4 text-[#5F7F6E]" />
                  <span>{t.dashboard.recentlyViewedTitle}</span>
                </h3>
                {data.recentlyViewed.length === 0 ? (
                  <p className="mt-3 text-xs text-[#5B6777] dark:text-[#A9B4C2]">{t.dashboard.emptyRecent}</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {data.recentlyViewed.map((s) => {
                      const loc = localizeScheme(s);
                      return (
                        <li key={s.id}>
                          <Link to={`/schemes/${s.id}`} className="text-xs font-medium text-[#1F6F78] hover:underline dark:text-[#CBB07A]">
                            {loc.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-[#E6E1D6] bg-white p-5 dark:border-[#1F2E42] dark:bg-[#111C2B]">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
                  <Calendar className="h-4 w-4 text-[#5F7F6E]" />
                  <span>{t.dashboard.upcomingDeadlinesTitle}</span>
                </h3>
                {data.upcomingDeadlines.length === 0 ? (
                  <p className="mt-3 text-xs text-[#5B6777] dark:text-[#A9B4C2]">{t.dashboard.emptyDeadlines}</p>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {data.upcomingDeadlines.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
                        <Link to={`/schemes/${s.id}`} className="truncate font-medium hover:underline">
                          {s.shortCode}
                        </Link>
                        <span className="font-mono tabular-nums text-[#9A712A] dark:text-[#D7B673]">
                          {s.applicationDeadlineIso}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-[#E6E1D6] bg-white p-5 dark:border-[#1F2E42] dark:bg-[#111C2B]">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
                    <Bell className="h-4 w-4 text-[#5F7F6E]" />
                    <span>{t.dashboard.notificationsTitle}</span>
                  </h3>
                  <Link to="/notifications" className="text-xs font-semibold text-[#1F6F78] dark:text-[#CBB07A]">
                    {t.dashboard.viewAll}
                  </Link>
                </div>
                {data.recentNotifications.length === 0 ? (
                  <p className="mt-3 text-xs text-[#5B6777] dark:text-[#A9B4C2]">{t.notifications.emptyNotifications}</p>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {data.recentNotifications.slice(0, 3).map((n) => {
                      const locNotif = localizeSystemNotification(n, language);
                      return (
                        <li key={n.id} className="text-xs">
                          <p className="font-semibold text-[#0F1D2E] dark:text-[#F4F1EA]">{locNotif.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-[#5B6777] dark:text-[#A9B4C2]">{locNotif.message}</p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
