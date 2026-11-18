import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkMinus, ExternalLink, Trash2 } from 'lucide-react';
import { APPLICATION_STATUSES, type ApplicationRecord, type GovernmentScheme } from '../../../backend/types/index.ts';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../components/UiPrimitives.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { DashboardLayout } from '../layouts/DashboardLayout.tsx';
import { apiRequest } from '../services/api.ts';
import {
  translateApplicationStatus,
  translateClassification,
  translateState,
  translateStatusHistoryNote,
  translateStatusSource,
} from '../translations/domainLabels.ts';

interface HydratedApplication extends ApplicationRecord {
  scheme: GovernmentScheme | null;
}

export function ApplicationTrackerPage() {
  const { language, t, localizeScheme } = useLanguage();
  const [items, setItems] = useState<HydratedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ items: HydratedApplication[] }>('/api/applications');
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [t.common.errorGeneric]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const updateApplication = async (id: string, patch: Record<string, unknown>) => {
    setSavingId(id);
    setError(null);
    try {
      const res = await apiRequest<{ item: HydratedApplication }>(`/api/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setItems((prev) => prev.map((a) => (a.id === id ? res.item : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setSavingId(null);
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      await apiRequest(`/api/applications/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    }
  };

  return (
    <DashboardLayout title={t.nav.applicationTracker}>
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold">{t.tracker.title}</h2>
          <p className="mt-1 text-sm text-[#465362] dark:text-[#A9B4C2]">{t.tracker.subtitle}</p>
        </div>

        {error && <ErrorBanner message={error} onRetry={loadApps} />}

        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : items.length === 0 ? (
          <EmptyState
            title={t.tracker.emptyTitle}
            description={t.tracker.emptyDesc}
            action={
              <Link
                to="/schemes"
                className="rounded-xl bg-[#0F1D2E] px-5 py-2.5 text-xs font-semibold text-[#FAF8F4] dark:bg-[#CBB07A] dark:text-[#0A121C]"
              >
                {t.nav.discoverSchemes}
              </Link>
            }
          />
        ) : (
          <div className="space-y-5">
            {items.map((app) => {
              const rawDocs = app.scheme?.requiredDocuments || [];
              const rawTasks = app.scheme?.preparationTasks || [];
              const locScheme = app.scheme ? localizeScheme(app.scheme) : null;
              const displayName = locScheme?.name || app.schemeName;

              return (
                <article
                  key={app.id}
                  className="rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <Link
                        to={`/schemes/${app.schemeId}`}
                        className="font-display text-lg font-semibold text-[#0F1D2E] hover:text-[#1F6F78] dark:text-[#F4F1EA] dark:hover:text-[#CBB07A]"
                      >
                        {displayName}
                      </Link>
                      <p className="mt-1 text-xs text-[#5B6777] dark:text-[#A9B4C2]">
                        {t.tracker.selfReportedBadge}:{' '}
                        <strong>{translateApplicationStatus(app.currentStatus, language)}</strong> ·{' '}
                        {t.tracker.updatedLabel}{' '}
                        <span className="font-mono tabular-nums">{app.updatedAt.slice(0, 10)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {app.scheme && (
                        <a
                          href={app.scheme.officialApplicationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6E1D6] px-3 py-2 text-xs font-semibold hover:bg-[#FAF8F4] dark:border-[#1F2E42] dark:hover:bg-[#19293D]"
                        >
                          <span>{t.schemes.officialPortal}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteApplication(app.id)}
                        aria-label={`${t.tracker.removeTrackerAria}: ${displayName}`}
                        className="rounded-xl border border-[#E6E1D6] p-2 text-[#9E3B3B] hover:bg-[#9E3B3B]/10 dark:border-[#1F2E42] dark:text-[#E58A8A]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status, Reference, Date Controls */}
                  <div className="mt-5 grid gap-4 border-t border-[#E6E1D6] pt-5 sm:grid-cols-3 dark:border-[#1F2E42]">
                    <div>
                      <label htmlFor={`status-${app.id}`} className="block text-xs font-semibold">
                        {t.tracker.updateStatus} ({t.tracker.selfReportedBadge})
                      </label>
                      <select
                        id={`status-${app.id}`}
                        value={app.currentStatus}
                        disabled={savingId === app.id}
                        onChange={(e) => updateApplication(app.id, { currentStatus: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
                      >
                        {APPLICATION_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {translateApplicationStatus(st, language)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor={`ref-${app.id}`} className="block text-xs font-semibold">
                        {t.tracker.refLabel}
                      </label>
                      <input
                        id={`ref-${app.id}`}
                        type="text"
                        defaultValue={app.applicationReference}
                        onBlur={(e) => {
                          if (e.target.value !== app.applicationReference) {
                            updateApplication(app.id, { applicationReference: e.target.value });
                          }
                        }}
                        placeholder={t.tracker.refPlaceholder}
                        className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 font-mono text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
                      />
                    </div>

                    <div>
                      <label htmlFor={`date-${app.id}`} className="block text-xs font-semibold">
                        {t.tracker.dateLabel}
                      </label>
                      <input
                        id={`date-${app.id}`}
                        type="date"
                        value={app.applicationDate}
                        onChange={(e) => updateApplication(app.id, { applicationDate: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 font-mono text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
                      />
                    </div>
                  </div>

                  {/* Document & Task Checklists */}
                  <div className="mt-5 grid gap-6 border-t border-[#E6E1D6] pt-5 md:grid-cols-2 dark:border-[#1F2E42]">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#5F7F6E] dark:text-[#78A08B]">
                        {t.tracker.documentsChecklist} ({app.collectedDocuments.length}/{rawDocs.length})
                      </p>
                      <div className="mt-2.5 space-y-2">
                        {rawDocs.map((rawDoc, idx) => {
                          const checked = app.collectedDocuments.includes(rawDoc);
                          const displayDoc = locScheme?.requiredDocuments[idx] ?? rawDoc;
                          return (
                            <label key={rawDoc} className="flex items-start gap-2.5 text-xs">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const nextDocs = e.target.checked
                                    ? [...app.collectedDocuments, rawDoc]
                                    : app.collectedDocuments.filter((d) => d !== rawDoc);
                                  updateApplication(app.id, { collectedDocuments: nextDocs });
                                }}
                                className="mt-0.5 h-4 w-4 rounded accent-[#1F6F78]"
                              />
                              <span className={checked ? 'line-through opacity-70' : ''}>{displayDoc}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#5F7F6E] dark:text-[#78A08B]">
                        {t.tracker.prepChecklist} ({app.completedTasks.length}/{rawTasks.length})
                      </p>
                      <div className="mt-2.5 space-y-2">
                        {rawTasks.map((rawTask, idx) => {
                          const checked = app.completedTasks.includes(rawTask);
                          const displayTask = locScheme?.preparationTasks[idx] ?? rawTask;
                          return (
                            <label key={rawTask} className="flex items-start gap-2.5 text-xs">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const nextTasks = e.target.checked
                                    ? [...app.completedTasks, rawTask]
                                    : app.completedTasks.filter((tItem) => tItem !== rawTask);
                                  updateApplication(app.id, { completedTasks: nextTasks });
                                }}
                                className="mt-0.5 h-4 w-4 rounded accent-[#1F6F78]"
                              />
                              <span className={checked ? 'line-through opacity-70' : ''}>{displayTask}</span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="mt-4">
                        <label htmlFor={`notes-${app.id}`} className="block text-xs font-semibold">
                          {t.tracker.notesLabel}
                        </label>
                        <textarea
                          id={`notes-${app.id}`}
                          rows={2}
                          defaultValue={app.notes}
                          onBlur={(e) => {
                            if (e.target.value !== app.notes) {
                              updateApplication(app.id, { notes: e.target.value });
                            }
                          }}
                          placeholder={t.tracker.notesPlaceholder}
                          className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-xs dark:border-[#1F2E42] dark:bg-[#0A121C]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status History */}
                  <div className="mt-5 border-t border-[#E6E1D6] pt-4 dark:border-[#1F2E42]">
                    <p className="text-xs font-semibold text-[#5B6777] dark:text-[#A9B4C2]">
                      {t.tracker.statusHistory}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {app.statusHistory.slice(0, 4).map((entry, idx) => (
                        <li key={idx} className="text-xs text-[#465362] dark:text-[#A9B4C2]">
                          <span className="font-mono tabular-nums text-[#5F7F6E]">{entry.changedAt.slice(0, 10)}</span> ·{' '}
                          <strong>{translateApplicationStatus(entry.status, language)}</strong> (
                          {translateStatusSource(entry.source, language)}) —{' '}
                          {translateStatusHistoryNote(entry.note, language)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export function SavedSchemesPage() {
  const { language, t, localizeScheme } = useLanguage();
  const [items, setItems] = useState<{ id: string; schemeId: string; savedAt: string; scheme: GovernmentScheme }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ items: typeof items }>('/api/saved-schemes');
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [t.common.errorGeneric]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const removeSaved = async (schemeId: string) => {
    await apiRequest(`/api/saved-schemes/${schemeId}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.schemeId !== schemeId));
  };

  return (
    <DashboardLayout title={t.nav.savedSchemes}>
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-bold">{t.nav.savedSchemes}</h2>
        {error && <ErrorBanner message={error} onRetry={loadSaved} />}
        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : items.length === 0 ? (
          <EmptyState
            title={t.tracker.savedEmptyTitle}
            description={t.tracker.savedEmptyDesc}
            action={
              <Link
                to="/schemes"
                className="rounded-xl bg-[#0F1D2E] px-5 py-2.5 text-xs font-semibold text-[#FAF8F4] dark:bg-[#CBB07A] dark:text-[#0A121C]"
              >
                {t.nav.discoverSchemes}
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map(({ scheme, savedAt }) => {
              const loc = localizeScheme(scheme);
              return (
                <div
                  key={scheme.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#E6E1D6] bg-white p-5 dark:border-[#1F2E42] dark:bg-[#111C2B]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/schemes/${scheme.id}`} className="font-display text-base font-semibold hover:text-[#1F6F78]">
                        {loc.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeSaved(scheme.id)}
                        aria-label={`${t.tracker.removeSavedAria}: ${loc.shortCode}`}
                        className="rounded-lg p-1.5 text-[#5B6777] hover:bg-[#FAF8F4] hover:text-[#9E3B3B] dark:hover:bg-[#19293D]"
                      >
                        <BookmarkMinus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-[#5B6777] dark:text-[#A9B4C2]">
                      {translateClassification(loc.classification, language)} ·{' '}
                      {translateState(loc.applicableState, language)} · {t.tracker.savedPrefix} {savedAt.slice(0, 10)}
                    </p>
                    <p className="mt-2.5 line-clamp-2 text-sm text-[#465362] dark:text-[#A9B4C2]">
                      {loc.officialDescription}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#E6E1D6] pt-3 dark:border-[#1F2E42]">
                    <Link to={`/schemes/${scheme.id}`} className="text-xs font-semibold text-[#1F6F78] dark:text-[#CBB07A]">
                      {t.schemes.viewDetails} →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
