import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck, CheckCircle2, ExternalLink, FileCheck2, HelpCircle, XCircle } from 'lucide-react';
import type { EligibilityResult, GovernmentScheme } from '../../../backend/types/index.ts';
import {
  EligibilityStatusText,
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
  translateClassification,
  translateState,
} from '../translations/domainLabels.ts';

export function SchemeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { language, localizeScheme, t } = useLanguage();
  const navigate = useNavigate();

  const [rawScheme, setRawScheme] = useState<GovernmentScheme | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingBusy, setTrackingBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    apiRequest<{ scheme: GovernmentScheme; eligibility: EligibilityResult | null }>(
      `/api/schemes/${id}?lang=${encodeURIComponent(language)}`
    )
      .then((res) => {
        setRawScheme(res.scheme);
        setEligibility(res.eligibility);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t.common.errorGeneric))
      .finally(() => setLoading(false));
  }, [id, language, t.common.errorGeneric]);

  useEffect(() => {
    if (!user || !id) return;
    apiRequest<{ items: { schemeId: string }[] }>('/api/saved-schemes')
      .then((res) => setIsSaved(res.items.some((i) => i.schemeId === id)))
      .catch(() => {});
  }, [user, id]);

  const scheme = rawScheme ? localizeScheme(rawScheme) : null;

  const handleToggleSave = async () => {
    if (!user || !scheme) {
      navigate('/login');
      return;
    }
    if (isSaved) {
      await apiRequest(`/api/saved-schemes/${scheme.id}`, { method: 'DELETE' });
      setIsSaved(false);
    } else {
      await apiRequest('/api/saved-schemes', {
        method: 'POST',
        body: JSON.stringify({ schemeId: scheme.id }),
      });
      setIsSaved(true);
    }
  };

  const handleStartTracking = async () => {
    if (!user || !scheme) {
      navigate('/login');
      return;
    }
    setTrackingBusy(true);
    try {
      await apiRequest('/api/applications', {
        method: 'POST',
        body: JSON.stringify({ schemeId: scheme.id, currentStatus: 'Preparing Documents' }),
      });
      navigate('/tracker');
    } catch (err) {
      if ((err as { status?: number })?.status === 409) {
        navigate('/tracker');
      } else {
        setError(err instanceof Error ? err.message : t.common.errorGeneric);
      }
    } finally {
      setTrackingBusy(false);
    }
  };

  const Content = (
    <div className="space-y-6">
      <Link
        to="/schemes"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6777] hover:text-[#0F1D2E] dark:text-[#A9B4C2] dark:hover:text-[#F4F1EA]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>{t.common.back} {t.schemes.backToDirectory}</span>
      </Link>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : scheme ? (
        <div className="space-y-6">
          {/* Header Card */}
          <section className="rounded-2xl border border-[#E6E1D6] bg-white p-6 sm:p-8 dark:border-[#1F2E42] dark:bg-[#111C2B]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-xs font-medium text-[#5B6777] dark:text-[#A9B4C2]">
                  {scheme.department} · {translateClassification(scheme.classification, language)} · {translateState(scheme.applicableState, language)}
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-[#0F1D2E] sm:text-3xl dark:text-[#F4F1EA]">
                  {scheme.name}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <VerificationStatusText status={scheme.verificationStatus} />
                  <span className="font-mono tabular-nums text-[#5B6777] dark:text-[#A9B4C2]">
                    {t.schemes.lastVerified}: {scheme.lastVerifiedDate}
                  </span>
                  <span className="text-[#5B6777] dark:text-[#A9B4C2]">
                    {translateAvailability(scheme.applicationAvailability, language)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E6E1D6] px-4 py-2.5 text-xs font-semibold hover:bg-[#FAF8F4] dark:border-[#1F2E42] dark:hover:bg-[#19293D]"
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="h-4 w-4 text-[#1F6F78] dark:text-[#CBB07A]" />
                      <span>{t.schemes.saved}</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" />
                      <span>{t.schemes.saveScheme}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleStartTracking}
                  disabled={trackingBusy}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0F1D2E] px-4 py-2.5 text-xs font-semibold text-[#FAF8F4] hover:bg-[#1C304A] dark:bg-[#CBB07A] dark:text-[#0A121C]"
                >
                  <FileCheck2 className="h-4 w-4" />
                  <span>{trackingBusy ? t.common.loading : t.schemes.startTracking}</span>
                </button>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-[#465362] dark:text-[#A9B4C2]">
              {scheme.officialDescription}
            </p>

            <div className="mt-6 grid gap-4 border-t border-[#E6E1D6] pt-5 sm:grid-cols-2 lg:grid-cols-4 dark:border-[#1F2E42]">
              <div>
                <p className="text-xs font-semibold text-[#5F7F6E] dark:text-[#78A08B]">{t.schemes.ageCriteriaLabel}</p>
                <p className="mt-1 text-xs text-[#0F1D2E] dark:text-[#F4F1EA]">{scheme.ageRestrictionsText}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#5F7F6E] dark:text-[#78A08B]">{t.schemes.incomeCriteriaLabel}</p>
                <p className="mt-1 text-xs text-[#0F1D2E] dark:text-[#F4F1EA]">{scheme.incomeRestrictionsText}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#5F7F6E] dark:text-[#78A08B]">{t.schemes.educationCriteriaLabel}</p>
                <p className="mt-1 text-xs text-[#0F1D2E] dark:text-[#F4F1EA]">{scheme.educationRequirementsText}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#5F7F6E] dark:text-[#78A08B]">{t.schemes.applicationDatesLabel}</p>
                <p className="mt-1 text-xs text-[#0F1D2E] dark:text-[#F4F1EA]">{scheme.applicationDatesText}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-[#E6E1D6] pt-5 dark:border-[#1F2E42]">
              <a
                href={scheme.officialApplicationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1F6F78] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#17575F] dark:bg-[#3898A3] dark:text-[#0A121C]"
              >
                <span>{t.schemes.officialPortal}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href={scheme.officialSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#465362] underline hover:text-[#0F1D2E] dark:text-[#A9B4C2]"
              >
                <span>{t.schemes.officialSource}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-xs text-[#64748B] dark:text-[#8E9BAE]">
                {t.schemes.directPortalNote}
              </span>
            </div>
          </section>

          {/* Deterministic Eligibility Breakdown (when signed in) */}
          {eligibility && (
            <section className="rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">{t.schemes.eligibilitySummaryTitle}</h3>
                <EligibilityStatusText classification={eligibility.classification} />
              </div>
              <p className="mt-2 text-sm text-[#465362] dark:text-[#A9B4C2]">{eligibility.reason}</p>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold text-[#1F6F78] dark:text-[#4BB8C4]">{t.eligibility.satisfied}</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#465362] dark:text-[#A9B4C2]">
                    {eligibility.conditionsSatisfied.length === 0 ? (
                      <li>{t.schemes.noneEvaluatedYet}</li>
                    ) : (
                      eligibility.conditionsSatisfied.map((c) => (
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
                  <ul className="mt-2 space-y-1.5 text-xs text-[#465362] dark:text-[#A9B4C2]">
                    {eligibility.missingInformation.length === 0 ? (
                      <li>{t.schemes.noMissingDetails}</li>
                    ) : (
                      eligibility.missingInformation.map((c) => (
                        <li key={c} className="flex items-start gap-1.5">
                          <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9A712A]" />
                          <span>{c}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#9E3B3B] dark:text-[#E58A8A]">{t.eligibility.notSatisfied}</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#465362] dark:text-[#A9B4C2]">
                    {eligibility.conditionsNotSatisfied.length === 0 ? (
                      <li>{t.schemes.noneLabel}</li>
                    ) : (
                      eligibility.conditionsNotSatisfied.map((c) => (
                        <li key={c} className="flex items-start gap-1.5">
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9E3B3B]" />
                          <span>{c}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Benefits, Documents & Procedure */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]">
              <h3 className="font-display text-lg font-semibold">{t.schemes.benefits}</h3>
              <ul className="mt-3 space-y-2 text-sm text-[#465362] dark:text-[#A9B4C2]">
                {scheme.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5F7F6E]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <h3 className="mt-6 font-display text-lg font-semibold">{t.schemes.requiredDocs}</h3>
              <ul className="mt-3 space-y-2 text-sm text-[#465362] dark:text-[#A9B4C2]">
                {scheme.requiredDocuments.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <span className="font-mono text-xs text-[#1F6F78] dark:text-[#CBB07A]">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]">
              <h3 className="font-display text-lg font-semibold">{t.schemes.procedure}</h3>
              <ol className="mt-3 space-y-3 text-sm text-[#465362] dark:text-[#A9B4C2]">
                {scheme.applicationProcedure.map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="font-mono text-xs font-semibold text-[#1F6F78] dark:text-[#CBB07A]">
                      0{i + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              {scheme.faqs.length > 0 && (
                <div className="mt-6 border-t border-[#E6E1D6] pt-5 dark:border-[#1F2E42]">
                  <h4 className="font-display text-sm font-semibold">{t.schemes.faqsHeading}</h4>
                  <div className="mt-3 space-y-3">
                    {scheme.faqs.map((faq) => (
                      <div key={faq.question}>
                        <p className="text-xs font-semibold text-[#0F1D2E] dark:text-[#F4F1EA]">{faq.question}</p>
                        <p className="mt-1 text-xs text-[#465362] dark:text-[#A9B4C2]">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );

  if (user) {
    return <DashboardLayout title={scheme?.shortCode || t.schemes.schemeDetailsTitle}>{Content}</DashboardLayout>;
  }
  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">{Content}</div>
    </PublicLayout>
  );
}
