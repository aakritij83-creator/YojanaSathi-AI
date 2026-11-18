import React, { useCallback, useEffect, useState } from 'react';
import { FileUp, Trash2 } from 'lucide-react';
import type { RejectionAnalysisRecord } from '../../../backend/types/index.ts';
import { ErrorBanner, LoadingSkeleton } from '../components/UiPrimitives.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { DashboardLayout } from '../layouts/DashboardLayout.tsx';
import { apiRequest } from '../services/api.ts';

export function RejectionAnalyzerPage() {
  const { language, t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [schemeNameHint, setSchemeNameHint] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<RejectionAnalysisRecord[]>([]);
  const [selected, setSelected] = useState<RejectionAnalysisRecord | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const res = await apiRequest<{ items: RejectionAnalysisRecord[] }>('/api/ai/rejection-analyses');
      setRecords(res.items);
      if (res.items.length > 0 && !selected) {
        setSelected(res.items[0]);
      }
    } catch {
      // handled silently
    } finally {
      setLoadingRecords(false);
    }
  }, [selected]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file && !rawText.trim()) {
      setError(t.rejection.uploadOrPasteError);
      return;
    }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (rawText.trim()) formData.append('rawText', rawText.trim());
      if (schemeNameHint.trim()) formData.append('schemeNameHint', schemeNameHint.trim());
      formData.append('language', language);

      const res = await apiRequest<{ item: RejectionAnalysisRecord }>('/api/ai/analyze-rejection', {
        method: 'POST',
        body: formData,
      });
      setRecords((prev) => [res.item, ...prev]);
      setSelected(res.item);
      setFile(null);
      setRawText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id: string) => {
    await apiRequest(`/api/ai/rejection-analyses/${id}`, { method: 'DELETE' });
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <DashboardLayout title={t.rejection.title}>
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold">{t.rejection.title}</h2>
          <p className="mt-1 text-sm text-[#465362] dark:text-[#A9B4C2]">{t.rejection.subtitle}</p>
        </div>

        {/* Upload / Paste Form */}
        <form
          onSubmit={handleAnalyze}
          className="rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="rej-file" className="block text-xs font-semibold">
                {t.rejection.uploadLabel}
              </label>
              <label
                htmlFor="rej-file"
                className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#CFC7B6] bg-[#FAF8F4] px-4 py-6 text-center hover:border-[#1F6F78] dark:border-[#2A3B52] dark:bg-[#0A121C]"
              >
                <FileUp className="h-5 w-5 text-[#1F6F78] dark:text-[#CBB07A]" />
                <span className="mt-2 text-xs font-medium">
                  {file ? `${file.name} (${Math.round(file.size / 1024)} KB)` : t.rejection.chooseFileLabel}
                </span>
                <input
                  id="rej-file"
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="sr-only"
                />
              </label>

              <div className="mt-4">
                <label htmlFor="rej-hint" className="block text-xs font-semibold">
                  {t.rejection.schemeHintLabel}
                </label>
                <input
                  id="rej-hint"
                  type="text"
                  value={schemeNameHint}
                  onChange={(e) => setSchemeNameHint(e.target.value)}
                  placeholder={t.rejection.schemeHintPlaceholder}
                  className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="rej-text" className="block text-xs font-semibold">
                {t.rejection.pasteLabel}
              </label>
              <textarea
                id="rej-text"
                rows={7}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={t.rejection.pastePlaceholder}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3.5 py-2.5 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4">
              <ErrorBanner message={error} />
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={analyzing}
              className="rounded-xl bg-[#0F1D2E] px-6 py-2.5 text-xs font-semibold text-[#FAF8F4] disabled:opacity-60 dark:bg-[#CBB07A] dark:text-[#0A121C]"
            >
              {analyzing ? t.rejection.analyzing : t.rejection.analyzeBtn}
            </button>
          </div>
        </form>

        {/* Saved Records & Active Analysis Breakdown */}
        <div className="grid gap-6 lg:grid-cols-12">
          <section className="rounded-2xl border border-[#E6E1D6] bg-white p-5 lg:col-span-4 dark:border-[#1F2E42] dark:bg-[#111C2B]">
            <h3 className="font-display text-sm font-semibold">{t.rejection.pastAnalyses}</h3>
            {loadingRecords ? (
              <div className="mt-3">
                <LoadingSkeleton rows={2} />
              </div>
            ) : records.length === 0 ? (
              <p className="mt-3 text-xs text-[#64748B]">{t.rejection.emptyAnalyses}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {records.map((rec) => (
                  <li
                    key={rec.id}
                    className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs ${
                      selected?.id === rec.id
                        ? 'bg-[#EFECE4] font-semibold dark:bg-[#1A2A3F]'
                        : 'hover:bg-[#FAF8F4] dark:hover:bg-[#162334]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(rec)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate">{rec.fileName || rec.schemeNameHint || t.rejection.pastedNoticeLabel}</p>
                      <p className="font-mono text-[11px] text-[#64748B]">{rec.createdAt.slice(0, 10)}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rec.id)}
                      aria-label={`${t.rejection.deleteRecord} ${rec.fileName || rec.id}`}
                      className="p-1 text-[#9E3B3B]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-[#E6E1D6] bg-white p-6 lg:col-span-8 dark:border-[#1F2E42] dark:bg-[#111C2B]">
            {!selected ? (
              <p className="text-sm text-[#5B6777] dark:text-[#A9B4C2]">
                {t.rejection.emptySelectPrompt}
              </p>
            ) : (
              <div className="space-y-5 text-sm">
                <div>
                  <h3 className="font-display text-base font-semibold">{t.rejection.summary}</h3>
                  <p className="mt-1.5 text-[#465362] dark:text-[#A9B4C2]">{selected.result.summary}</p>
                </div>

                <div>
                  <h4 className="font-display text-sm font-semibold">{t.rejection.explicitReason}</h4>
                  <p className="mt-1 text-xs text-[#465362] dark:text-[#A9B4C2]">
                    {selected.result.explicitlyStatedReason}
                  </p>
                </div>

                <div className="grid gap-4 border-t border-[#E6E1D6] pt-4 sm:grid-cols-2 dark:border-[#1F2E42]">
                  <div>
                    <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-[#9E3B3B] dark:text-[#E58A8A]">
                      {t.rejection.confirmedReasons}
                    </h4>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[#465362] dark:text-[#A9B4C2]">
                      {selected.result.confirmedReasons.length === 0 ? (
                        <li>{t.rejection.noneVerbatim}</li>
                      ) : (
                        selected.result.confirmedReasons.map((r) => <li key={r}>{r}</li>)
                      )}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-[#9A712A] dark:text-[#D7B673]">
                      {t.rejection.possibleReasons}
                    </h4>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[#465362] dark:text-[#A9B4C2]">
                      {selected.result.possibleContributingReasons.length === 0 ? (
                        <li>{t.rejection.noneIdentified}</li>
                      ) : (
                        selected.result.possibleContributingReasons.map((r) => <li key={r}>{r}</li>)
                      )}
                    </ul>
                  </div>
                </div>

                <div className="grid gap-4 border-t border-[#E6E1D6] pt-4 sm:grid-cols-2 dark:border-[#1F2E42]">
                  <div>
                    <h4 className="font-display text-xs font-semibold">{t.rejection.missingInfo}</h4>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-[#465362] dark:text-[#A9B4C2]">
                      {selected.result.missingInformation.length === 0 ? (
                        <li>{t.rejection.noneNoted}</li>
                      ) : (
                        selected.result.missingInformation.map((m) => <li key={m}>{m}</li>)
                      )}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-display text-xs font-semibold">{t.rejection.docsCorrection}</h4>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-[#465362] dark:text-[#A9B4C2]">
                      {selected.result.documentsRequiringCorrection.length === 0 ? (
                        <li>{t.rejection.noneSpecified}</li>
                      ) : (
                        selected.result.documentsRequiringCorrection.map((d) => <li key={d}>{d}</li>)
                      )}
                    </ul>
                  </div>
                </div>

                <div className="grid gap-4 border-t border-[#E6E1D6] pt-4 sm:grid-cols-2 dark:border-[#1F2E42]">
                  <div>
                    <h4 className="font-display text-xs font-semibold">{t.rejection.correctiveSteps}</h4>
                    <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-xs text-[#465362] dark:text-[#A9B4C2]">
                      {selected.result.suggestedCorrectiveSteps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-display text-xs font-semibold">{t.rejection.nextActions}</h4>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-[#465362] dark:text-[#A9B4C2]">
                      {selected.result.possibleNextActions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="border-t border-[#E6E1D6] pt-4 text-xs dark:border-[#1F2E42]">
                  <h4 className="font-display font-semibold">{t.rejection.grievanceResources}</h4>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[#1F6F78] dark:text-[#CBB07A]">
                    {selected.result.verifiedGrievanceResources.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[#64748B] dark:text-[#8E9BAE]">{selected.result.disclaimer}</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
