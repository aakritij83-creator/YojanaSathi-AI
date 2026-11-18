import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { PublicLayout } from '../layouts/PublicLayout.tsx';
import { apiRequest } from '../services/api.ts';
import { translateFeedbackCategory } from '../translations/domainLabels.ts';

export function HowItWorksPage() {
  const { t } = useLanguage();
  return (
    <PublicLayout>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#0F1D2E] sm:text-4xl dark:text-[#F4F1EA]">
          {t.home.howItWorksTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[#465362] dark:text-[#A9B4C2]">
          {t.home.howItWorksSubtitle}
        </p>

        <div className="mt-10 space-y-6">
          {[
            {
              title: t.home.step1Title,
              desc: t.home.step1Desc,
              details: [t.info.step1Detail1, t.info.step1Detail2],
            },
            {
              title: t.home.step2Title,
              desc: t.home.step2Desc,
              details: [t.info.step2Detail1, t.info.step2Detail2, t.info.step2Detail3],
            },
            {
              title: t.home.step3Title,
              desc: t.home.step3Desc,
              details: [t.info.step3Detail1, t.info.step3Detail2, t.info.step3Detail3],
            },
          ].map((step, idx) => (
            <section
              key={idx}
              className="rounded-2xl border border-[#E6E1D6] bg-white p-6 sm:p-8 dark:border-[#1F2E42] dark:bg-[#111C2B]"
            >
              <h2 className="font-display text-xl font-semibold text-[#0F1D2E] dark:text-[#F4F1EA]">
                {step.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#465362] dark:text-[#A9B4C2]">{step.desc}</p>
              <ul className="mt-4 space-y-2">
                {step.details.map((d, di) => (
                  <li key={di} className="flex items-start gap-2.5 text-sm text-[#465362] dark:text-[#A9B4C2]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1F6F78] dark:text-[#CBB07A]" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/schemes"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F1D2E] px-6 py-3 text-sm font-semibold text-[#FAF8F4] dark:bg-[#CBB07A] dark:text-[#0A121C]"
          >
            <span>{t.home.primaryCta}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/eligibility"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E6E1D6] bg-white px-6 py-3 text-sm font-semibold dark:border-[#1F2E42] dark:bg-[#111C2B]"
          >
            <span>{t.home.secondaryCta}</span>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}

const FEEDBACK_CATEGORIES = ['General Feedback', 'Scheme Accuracy', 'Translation', 'Bug Report'] as const;

export function AboutPage() {
  const { language, t } = useLanguage();
  const [category, setCategory] = useState<'Scheme Accuracy' | 'Bug Report' | 'Translation' | 'General Feedback'>('General Feedback');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (message.trim().length < 5) {
      setStatusMsg({ type: 'err', text: t.info.feedbackMinLengthError });
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ category, message }),
      });
      setMessage('');
      setStatusMsg({ type: 'ok', text: t.info.feedbackSuccessMsg });
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : t.info.feedbackFailedMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#0F1D2E] sm:text-4xl dark:text-[#F4F1EA]">
          {t.info.aboutTitle}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#465362] dark:text-[#A9B4C2]">
          {t.info.aboutIntro}
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]">
            <ShieldCheck className="h-5 w-5 text-[#1F6F78] dark:text-[#CBB07A]" />
            <h2 className="mt-3 font-display text-lg font-semibold">{t.info.sourceIntegrityTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#465362] dark:text-[#A9B4C2]">
              {t.info.sourceIntegrityDesc}
            </p>
          </div>
          <div className="rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]">
            <Lock className="h-5 w-5 text-[#1F6F78] dark:text-[#CBB07A]" />
            <h2 className="mt-3 font-display text-lg font-semibold">{t.info.privacyDesignTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#465362] dark:text-[#A9B4C2]">
              {t.info.privacyDesignDesc}
            </p>
          </div>
        </div>

        {/* Citizen Feedback Form */}
        <section className="mt-12 rounded-2xl border border-[#E6E1D6] bg-white p-6 sm:p-8 dark:border-[#1F2E42] dark:bg-[#111C2B]">
          <h2 className="font-display text-xl font-semibold">{t.info.feedbackTitle}</h2>
          <p className="mt-1.5 text-sm text-[#465362] dark:text-[#A9B4C2]">
            {t.info.feedbackSubtitle}
          </p>
          <form onSubmit={handleFeedback} className="mt-5 space-y-4">
            <div>
              <label htmlFor="fb-category" className="block text-xs font-semibold uppercase tracking-wider text-[#5B6777] dark:text-[#A9B4C2]">
                {t.info.feedbackCategoryLabel}
              </label>
              <select
                id="fb-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="mt-1.5 w-full max-w-sm rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3.5 py-2.5 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {translateFeedbackCategory(cat, language)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="fb-message" className="block text-xs font-semibold uppercase tracking-wider text-[#5B6777] dark:text-[#A9B4C2]">
                {t.info.feedbackMessageLabel}
              </label>
              <textarea
                id="fb-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.info.feedbackPlaceholder}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3.5 py-2.5 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
            </div>
            {statusMsg && (
              <p className={`text-sm font-medium ${statusMsg.type === 'ok' ? 'text-[#3F6B56] dark:text-[#78A08B]' : 'text-[#9E3B3B] dark:text-[#E58A8A]'}`}>
                {statusMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#0F1D2E] px-5 py-2.5 text-sm font-semibold text-[#FAF8F4] disabled:opacity-60 dark:bg-[#CBB07A] dark:text-[#0A121C]"
            >
              {submitting ? t.info.feedbackSubmitting : t.info.feedbackSubmitBtn}
            </button>
          </form>
        </section>
      </div>
    </PublicLayout>
  );
}

export function PrivacyPolicyPage() {
  const { t } = useLanguage();
  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold">{t.info.privacyTitle}</h1>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-[#465362] dark:text-[#A9B4C2]">
          <p>{t.info.privacyP1}</p>
          <p>
            <strong>{t.info.privacyP2Label}</strong> {t.info.privacyP2Body}
          </p>
          <p>
            <strong>{t.info.privacyP3Label}</strong> {t.info.privacyP3Body}
          </p>
          <p>
            <strong>{t.info.privacyP4Label}</strong> {t.info.privacyP4Body}
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}

export function TermsPage() {
  const { t } = useLanguage();
  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold">{t.info.termsTitle}</h1>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-[#465362] dark:text-[#A9B4C2]">
          <p>{t.info.termsP1}</p>
          <p>{t.info.termsP2}</p>
          <p>{t.info.termsP3}</p>
        </div>
      </div>
    </PublicLayout>
  );
}
