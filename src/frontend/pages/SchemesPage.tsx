import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, ExternalLink, Search, SlidersHorizontal } from 'lucide-react';
import { INDIAN_STATES_AND_UTS } from '../../../backend/data/verifiedSchemes.ts';
import { SCHEME_CATEGORIES, type EligibilityResult, type GovernmentScheme } from '../../../backend/types/index.ts';
import {
  EligibilityStatusText,
  EmptyState,
  ErrorBanner,
  LoadingSkeleton,
  VerificationStatusText,
} from '../components/UiPrimitives.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { DashboardLayout } from '../layouts/DashboardLayout.tsx';
import { PublicLayout } from '../layouts/PublicLayout.tsx';
import { apiRequest } from '../services/api.ts';
import {
  translateAvailability,
  translateCategory,
  translateClassification,
  translateState,
} from '../translations/domainLabels.ts';

interface SchemeListItem extends GovernmentScheme {
  eligibility: EligibilityResult | null;
}

interface SchemesResponse {
  items: SchemeListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function SchemesPage() {
  const { user } = useAuth();
  const { language, localizeScheme, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [stateFilter, setStateFilter] = useState(searchParams.get('state') || 'All');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'All');
  const [classificationFilter, setClassificationFilter] = useState(searchParams.get('classification') || 'All');
  const [availabilityFilter, setAvailabilityFilter] = useState(searchParams.get('availability') || 'All');
  const [eligibilityFilter, setEligibilityFilter] = useState(searchParams.get('eligibility') || 'All');
  const [sort, setSort] = useState(searchParams.get('sort') || 'name');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const [data, setData] = useState<SchemesResponse | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchemes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (stateFilter !== 'All') params.set('state', stateFilter);
      if (categoryFilter !== 'All') params.set('category', categoryFilter);
      if (classificationFilter !== 'All') params.set('classification', classificationFilter);
      if (availabilityFilter !== 'All') params.set('availability', availabilityFilter);
      if (eligibilityFilter !== 'All' && user) params.set('eligibility', eligibilityFilter);
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('pageSize', '9');
      params.set('lang', language);

      const res = await apiRequest<SchemesResponse>(`/api/schemes?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [
    q,
    stateFilter,
    categoryFilter,
    classificationFilter,
    availabilityFilter,
    eligibilityFilter,
    sort,
    page,
    user,
    language,
    t.common.errorGeneric,
  ]);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  useEffect(() => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    apiRequest<{ items: { schemeId: string }[] }>('/api/saved-schemes')
      .then((res) => setSavedIds(new Set(res.items.map((i) => i.schemeId))))
      .catch(() => {});
  }, [user]);

  const toggleSave = async (schemeId: string) => {
    if (!user) return;
    const isSaved = savedIds.has(schemeId);
    try {
      if (isSaved) {
        await apiRequest(`/api/saved-schemes/${schemeId}`, { method: 'DELETE' });
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(schemeId);
          return next;
        });
      } else {
        await apiRequest('/api/saved-schemes', {
          method: 'POST',
          body: JSON.stringify({ schemeId }),
        });
        setSavedIds((prev) => new Set(prev).add(schemeId));
      }
    } catch {
      // handled silently
    }
  };

  const resetFilters = () => {
    setQ('');
    setStateFilter('All');
    setCategoryFilter('All');
    setClassificationFilter('All');
    setAvailabilityFilter('All');
    setEligibilityFilter('All');
    setSort('name');
    setPage(1);
    setSearchParams({});
  };

  const Content = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F1D2E] dark:text-[#F4F1EA]">
            {t.schemes.title}
          </h2>
          <p className="mt-1 text-sm text-[#465362] dark:text-[#A9B4C2]">{t.schemes.subtitle}</p>
        </div>
        {data && (
          <p className="font-mono text-xs tabular-nums text-[#5B6777] dark:text-[#A9B4C2]">
            {data.total} {t.schemes.schemesIndexed}
          </p>
        )}
      </div>

      {/* Search & Multi-Facet Filters */}
      <div className="rounded-2xl border border-[#E6E1D6] bg-white p-4 sm:p-5 dark:border-[#1F2E42] dark:bg-[#111C2B]">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" aria-hidden="true" />
            <label htmlFor="scheme-search-input" className="sr-only">
              {t.schemes.searchPlaceholder}
            </label>
            <input
              id="scheme-search-input"
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={t.schemes.searchPlaceholder}
              className="w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] py-2.5 pl-10 pr-4 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#5F7F6E] dark:text-[#78A08B]" aria-hidden="true" />
            <select
              aria-label={t.schemes.sortAria}
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2.5 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
            >
              <option value="name">{t.schemes.sortName}</option>
              <option value="verifiedDate">{t.schemes.sortVerified}</option>
              {user && <option value="eligibility">{t.schemes.sortEligibility}</option>}
            </select>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select
            aria-label={t.schemes.filterStateAria}
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-xs font-medium dark:border-[#1F2E42] dark:bg-[#0A121C]"
          >
            <option value="All">{t.schemes.allStates}</option>
            {INDIAN_STATES_AND_UTS.map((s) => (
              <option key={s} value={s}>
                {translateState(s, language)}
              </option>
            ))}
          </select>

          <select
            aria-label={t.schemes.filterCategoryAria}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-xs font-medium dark:border-[#1F2E42] dark:bg-[#0A121C]"
          >
            <option value="All">{t.schemes.allCategories}</option>
            {SCHEME_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {translateCategory(c, language)}
              </option>
            ))}
          </select>

          <select
            aria-label={t.schemes.filterLevelAria}
            value={classificationFilter}
            onChange={(e) => {
              setClassificationFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-xs font-medium dark:border-[#1F2E42] dark:bg-[#0A121C]"
          >
            <option value="All">{t.schemes.allTypes}</option>
            <option value="Central">{t.schemes.centralOnly}</option>
            <option value="State">{t.schemes.stateOnly}</option>
          </select>

          <select
            aria-label={t.schemes.filterAvailabilityAria}
            value={availabilityFilter}
            onChange={(e) => {
              setAvailabilityFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-xs font-medium dark:border-[#1F2E42] dark:bg-[#0A121C]"
          >
            <option value="All">{t.schemes.allAvailability}</option>
            <option value="Open Year-Round">{translateAvailability('Open Year-Round', language)}</option>
            <option value="Seasonal Window">{translateAvailability('Seasonal Window', language)}</option>
            <option value="Check Official Portal">{translateAvailability('Check Official Portal', language)}</option>
          </select>

          {user ? (
            <select
              aria-label={t.schemes.filterEligibilityAria}
              value={eligibilityFilter}
              onChange={(e) => {
                setEligibilityFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-xs font-medium dark:border-[#1F2E42] dark:bg-[#0A121C]"
            >
              <option value="All">{t.schemes.allEligibility}</option>
              <option value="Likely Eligible">{t.eligibility.likelyEligible}</option>
              <option value="Potentially Eligible">{t.eligibility.potentiallyEligible}</option>
              <option value="Not Currently Eligible">{t.eligibility.notEligible}</option>
            </select>
          ) : (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-[#E6E1D6] px-3 py-2 text-xs font-semibold text-[#465362] hover:bg-[#F3EFE7] dark:border-[#1F2E42] dark:text-[#A9B4C2]"
            >
              {t.schemes.clearFilters}
            </button>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadSchemes} />}

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          title={t.schemes.noResults}
          description={t.schemes.noResultsDesc}
          action={
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl bg-[#0F1D2E] px-4 py-2 text-xs font-semibold text-[#FAF8F4] dark:bg-[#CBB07A] dark:text-[#0A121C]"
            >
              {t.schemes.clearFilters}
            </button>
          }
        />
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data?.items.map((rawScheme) => {
              const scheme = localizeScheme(rawScheme);
              const isSaved = savedIds.has(scheme.id);
              return (
                <article
                  key={scheme.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#E6E1D6] bg-white p-5 transition-colors hover:border-[#CFC7B6] dark:border-[#1F2E42] dark:bg-[#111C2B] dark:hover:border-[#324661]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        to={`/schemes/${scheme.id}`}
                        className="font-display text-base font-semibold leading-snug text-[#0F1D2E] hover:text-[#1F6F78] dark:text-[#F4F1EA] dark:hover:text-[#CBB07A]"
                      >
                        {scheme.name}
                      </Link>
                      {user && (
                        <button
                          type="button"
                          onClick={() => toggleSave(scheme.id)}
                          aria-label={isSaved ? `${t.schemes.removeSavedAria}: ${scheme.shortCode}` : `${t.schemes.saveAria}: ${scheme.shortCode}`}
                          className="rounded-lg p-1.5 text-[#5B6777] hover:bg-[#FAF8F4] hover:text-[#0F1D2E] dark:text-[#A9B4C2] dark:hover:bg-[#1A2A3F]"
                        >
                          {isSaved ? (
                            <BookmarkCheck className="h-4 w-4 text-[#1F6F78] dark:text-[#CBB07A]" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Zero-Pill Metadata Line */}
                    <p className="mt-2 text-xs text-[#5B6777] dark:text-[#A9B4C2]">
                      {translateClassification(scheme.classification, language)} · {translateState(scheme.applicableState, language)} ·{' '}
                      <span className="font-mono tabular-nums">{scheme.lastVerifiedDate}</span>
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <VerificationStatusText status={scheme.verificationStatus} />
                      {rawScheme.eligibility && <EligibilityStatusText classification={rawScheme.eligibility.classification} />}
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#465362] dark:text-[#A9B4C2]">
                      {scheme.officialDescription}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#E6E1D6] pt-4 dark:border-[#1F2E42]">
                    <Link
                      to={`/schemes/${scheme.id}`}
                      className="text-xs font-semibold text-[#0F1D2E] hover:text-[#1F6F78] dark:text-[#F4F1EA] dark:hover:text-[#CBB07A]"
                    >
                      {t.schemes.viewDetails} →
                    </Link>
                    <a
                      href={scheme.officialApplicationUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${t.schemes.officialPortalAria}: ${scheme.shortCode}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#5B6777] hover:text-[#0F1D2E] dark:text-[#A9B4C2] dark:hover:text-[#F4F1EA]"
                    >
                      <span>{t.schemes.portalShort}</span>
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#E6E1D6] pt-4 dark:border-[#1F2E42]">
              <p className="font-mono text-xs tabular-nums text-[#5B6777] dark:text-[#A9B4C2]">
                {t.schemes.pageWord} {data.page} {t.schemes.ofWord} {data.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E6E1D6] bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-40 dark:border-[#1F2E42] dark:bg-[#111C2B]"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>{t.common.previous}</span>
                </button>
                <button
                  type="button"
                  disabled={data.page >= data.totalPages}
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E6E1D6] bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-40 dark:border-[#1F2E42] dark:bg-[#111C2B]"
                >
                  <span>{t.common.next}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (user) {
    return <DashboardLayout title={t.nav.discoverSchemes}>{Content}</DashboardLayout>;
  }
  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{Content}</div>
    </PublicLayout>
  );
}
