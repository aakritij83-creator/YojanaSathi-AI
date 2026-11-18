import React from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, Info, RefreshCw, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import type { EligibilityClassification, VerificationStatus } from '../../../backend/types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { translateVerificationStatus } from '../translations/domainLabels.ts';

export function EligibilityStatusText({ classification }: { classification: EligibilityClassification }) {
  const { t } = useLanguage();
  if (classification === 'Likely Eligible') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F6F78] dark:text-[#4BB8C4]">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{t.eligibility.likelyEligible}</span>
      </span>
    );
  }
  if (classification === 'Potentially Eligible') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A712A] dark:text-[#D7B673]">
        <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{t.eligibility.potentiallyEligible}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9E3B3B] dark:text-[#E58A8A]">
      <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{t.eligibility.notEligible}</span>
    </span>
  );
}

export function VerificationStatusText({ status }: { status: VerificationStatus }) {
  const { language } = useLanguage();
  const label = translateVerificationStatus(status, language);
  if (status === 'Verified') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#3F6B56] dark:text-[#78A08B]">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#9A712A] dark:text-[#D7B673]">
      <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#9E3B3B]/30 bg-[#9E3B3B]/8 px-4 py-3 text-sm text-[#7D2626] dark:border-[#E58A8A]/30 dark:bg-[#9E3B3B]/15 dark:text-[#F5B5B5]"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-current/25 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10 whitespace-nowrap shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t.common.retry}</span>
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E6E1D6] bg-white/70 px-6 py-12 text-center dark:border-[#1F2E42] dark:bg-[#111C2B]/70">
      <Info className="mb-3 h-7 w-7 text-[#5F7F6E] dark:text-[#78A08B]" aria-hidden="true" />
      <h3 className="font-display text-base font-semibold text-[#0F1D2E] dark:text-[#F4F1EA]">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-[#4A5568] dark:text-[#A9B4C2]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-3" aria-busy="true" aria-label={t.errors.loadingAria}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-20 w-full animate-pulse rounded-xl border border-[#E6E1D6] bg-[#F2EFE8] dark:border-[#1F2E42] dark:bg-[#162334]"
        />
      ))}
    </div>
  );
}
