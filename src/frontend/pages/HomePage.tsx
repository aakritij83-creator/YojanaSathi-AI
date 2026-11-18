import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Bot, CheckCircle2, ChevronDown, FileSearch, ShieldCheck } from 'lucide-react';
import { SCHEME_CATEGORIES } from '../../../backend/types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { PublicLayout } from '../layouts/PublicLayout.tsx';
import { translateCategory } from '../translations/domainLabels.ts';

export function HomePage() {
  const { language, t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    { q: t.home.faq1Q, a: t.home.faq1A },
    { q: t.home.faq2Q, a: t.home.faq2A },
    { q: t.home.faq3Q, a: t.home.faq3A },
    { q: t.home.faq4Q, a: t.home.faq4A },
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="border-b border-[#E6E1D6] dark:border-[#1F2E42]">
        <div className="mx-auto grid max-w-7xl items-stretch gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:py-20 lg:px-8">
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="text-xs font-semibold tracking-wide text-[#5F7F6E] dark:text-[#78A08B]">
              {t.home.trustNote}
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.15rem,4vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-[#0F1D2E] [text-wrap:balance] dark:text-[#F4F1EA]">
              {t.home.heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#465362] sm:text-lg dark:text-[#A9B4C2]">
              {t.home.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/schemes"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F1D2E] px-6 py-3.5 text-sm font-semibold text-[#FAF8F4] transition-colors hover:bg-[#1C304A] dark:bg-[#CBB07A] dark:text-[#0A121C] dark:hover:bg-[#DEC58E] whitespace-nowrap shrink-0"
              >
                <span>{t.home.primaryCta}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/eligibility"
                className="inline-flex items-center gap-2 rounded-xl border border-[#CFC7B6] bg-white px-6 py-3.5 text-sm font-semibold text-[#0F1D2E] transition-colors hover:bg-[#F3EFE7] dark:border-[#2A3B52] dark:bg-[#111C2B] dark:text-[#F4F1EA] dark:hover:bg-[#1A2A3F] whitespace-nowrap shrink-0"
              >
                <span>{t.home.secondaryCta}</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-[#E6E1D6] bg-gradient-to-br from-[#0F1D2E] via-[#1B3A4B] to-[#5F7F6E] dark:border-[#1F2E42]">
              <img
                src="/src/assets/images/hero_civic_architecture_1795031670004.jpg"
                alt={t.home.heroImageAlt}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover lg:h-full"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0A121C]/85 via-[#0A121C]/35 to-transparent p-6 text-[#FAF8F4]">
                <p className="font-display text-sm font-semibold">
                  {t.brand.name} — {t.brand.tagline}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How YojanaSathi AI Works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F1D2E] sm:text-3xl dark:text-[#F4F1EA]">
            {t.home.howItWorksTitle}
          </h2>
          <p className="mt-2.5 text-base text-[#465362] dark:text-[#A9B4C2]">
            {t.home.howItWorksSubtitle}
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { title: t.home.step1Title, desc: t.home.step1Desc },
            { title: t.home.step2Title, desc: t.home.step2Desc },
            { title: t.home.step3Title, desc: t.home.step3Desc },
          ].map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]"
            >
              <h3 className="font-display text-lg font-semibold text-[#0F1D2E] dark:text-[#F4F1EA]">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#465362] dark:text-[#A9B4C2]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Showcase + Categories */}
      <section className="border-y border-[#E6E1D6] bg-white py-16 dark:border-[#1F2E42] dark:bg-[#0E1826]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F1D2E] sm:text-3xl dark:text-[#F4F1EA]">
                {t.home.categoriesTitle}
              </h2>
              <p className="mt-2 text-base text-[#465362] dark:text-[#A9B4C2]">
                {t.home.categoriesSubtitle}
              </p>
            </div>
            <Link
              to="/schemes"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F6F78] hover:underline dark:text-[#CBB07A]"
            >
              <span>{t.home.primaryCta}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* 3 Curated Editorial Photo Spotlights */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                img: '/src/assets/images/category_education_study_1795031671461.jpg',
                alt: t.home.spotlight1Alt,
                title: t.home.spotlight1Title,
                desc: t.home.spotlight1Desc,
                cat: 'Education and Scholarships',
              },
              {
                img: '/src/assets/images/category_agriculture_field_1795031671996.jpg',
                alt: t.home.spotlight2Alt,
                title: t.home.spotlight2Title,
                desc: t.home.spotlight2Desc,
                cat: 'Farmers and Agriculture',
              },
              {
                img: '/src/assets/images/category_enterprise_craft_1795031672860.jpg',
                alt: t.home.spotlight3Alt,
                title: t.home.spotlight3Title,
                desc: t.home.spotlight3Desc,
                cat: 'Women Empowerment',
              },
            ].map((card) => (
              <Link
                key={card.cat}
                to={`/schemes?category=${encodeURIComponent(card.cat)}`}
                className="group overflow-hidden rounded-2xl border border-[#E6E1D6] bg-[#FAF8F4] transition-transform duration-200 hover:-translate-y-0.5 dark:border-[#1F2E42] dark:bg-[#111C2B]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#E6E1D6] dark:bg-[#162334]">
                  <img
                    src={card.img}
                    alt={card.alt}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-base font-semibold text-[#0F1D2E] dark:text-[#F4F1EA]">
                    {card.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#465362] dark:text-[#A9B4C2]">
                    {card.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* All 14 Categories Directory Links */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {SCHEME_CATEGORIES.map((category) => (
              <Link
                key={category}
                to={`/schemes?category=${encodeURIComponent(category)}`}
                className="flex items-center justify-between rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-4 py-3 text-sm font-medium text-[#0F1D2E] transition-colors hover:border-[#1F6F78] hover:bg-white dark:border-[#1F2E42] dark:bg-[#111C2B] dark:text-[#F4F1EA] dark:hover:border-[#CBB07A]"
              >
                <span className="truncate">{translateCategory(category, language)}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#5F7F6E] dark:text-[#78A08B]" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features & AI Assistance */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F1D2E] sm:text-3xl dark:text-[#F4F1EA]">
              {t.home.featuresTitle}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#465362] dark:text-[#A9B4C2]">
              {t.home.aiSpotlightDesc}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rounded-xl bg-[#1F6F78] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#17575F] dark:bg-[#3898A3] dark:text-[#0A121C]"
              >
                {t.nav.register}
              </Link>
              <Link
                to="/eligibility"
                className="rounded-xl border border-[#E6E1D6] bg-white px-5 py-3 text-sm font-semibold text-[#0F1D2E] transition-colors hover:bg-[#F3EFE7] dark:border-[#1F2E42] dark:bg-[#111C2B] dark:text-[#F4F1EA]"
              >
                {t.home.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-7">
            {[
              {
                icon: ShieldCheck,
                title: t.home.feature1Title,
                desc: t.home.feature1Desc,
              },
              {
                icon: Bot,
                title: t.home.feature2Title,
                desc: t.home.feature2Desc,
              },
              {
                icon: FileSearch,
                title: t.home.feature3Title,
                desc: t.home.feature3Desc,
              },
              {
                icon: BookOpen,
                title: t.home.feature4Title,
                desc: t.home.feature4Desc,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#E6E1D6] bg-white p-5 dark:border-[#1F2E42] dark:bg-[#111C2B]"
                >
                  <Icon className="h-5 w-5 text-[#1F6F78] dark:text-[#CBB07A]" aria-hidden="true" />
                  <h3 className="mt-3 font-display text-base font-semibold text-[#0F1D2E] dark:text-[#F4F1EA]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#465362] dark:text-[#A9B4C2]">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Citizen Benefits + FAQs */}
      <section className="border-t border-[#E6E1D6] bg-white py-16 dark:border-[#1F2E42] dark:bg-[#0E1826]">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F1D2E] dark:text-[#F4F1EA]">
              {t.home.benefitsTitle}
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                t.home.benefit1,
                t.home.benefit2,
                t.home.benefit3,
                t.home.benefit4,
              ].map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-[#465362] dark:text-[#A9B4C2]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5F7F6E] dark:text-[#78A08B]" aria-hidden="true" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F1D2E] dark:text-[#F4F1EA]">
              {t.home.faqTitle}
            </h2>
            <div className="mt-6 divide-y divide-[#E6E1D6] rounded-2xl border border-[#E6E1D6] bg-[#FAF8F4] dark:divide-[#1F2E42] dark:border-[#1F2E42] dark:bg-[#111C2B]">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-[#0F1D2E] dark:text-[#F4F1EA]"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-sm leading-relaxed text-[#465362] dark:text-[#A9B4C2]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Public Notice Disclaimer */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]">
          <h2 className="font-display text-sm font-semibold text-[#0F1D2E] dark:text-[#F4F1EA]">
            {t.home.disclaimerTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#465362] dark:text-[#A9B4C2]">
            {t.home.disclaimerBody}
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
