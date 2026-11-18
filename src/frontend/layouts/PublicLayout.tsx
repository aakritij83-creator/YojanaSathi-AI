import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Globe, Menu, Moon, Sun, X } from 'lucide-react';
import type { LanguageCode } from '../../../backend/types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { apiRequest } from '../services/api.ts';
import { LANGUAGE_OPTIONS } from '../translations/index.ts';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLanguageChange = async (next: LanguageCode) => {
    setLanguage(next);
    if (user) {
      try {
        const res = await apiRequest<{ user: typeof user }>('/api/profile/preferences', {
          method: 'PATCH',
          body: JSON.stringify({ preferredLanguage: next }),
        });
        setUser(res.user);
      } catch {
        // local preference already saved
      }
    }
  };

  const handleThemeToggle = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    toggleTheme();
    if (user) {
      try {
        const res = await apiRequest<{ user: typeof user }>('/api/profile/preferences', {
          method: 'PATCH',
          body: JSON.stringify({ themePreference: nextTheme }),
        });
        setUser(res.user);
      } catch {
        // local preference already saved
      }
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
      isActive
        ? 'border-[#1F6F78] text-[#0F1D2E] dark:border-[#CBB07A] dark:text-[#F4F1EA]'
        : 'border-transparent text-[#465362] hover:text-[#0F1D2E] dark:text-[#A9B4C2] dark:hover:text-[#F4F1EA]'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#0F1D2E] dark:bg-[#0A121C] dark:text-[#F4F1EA]">
      <header className="sticky top-0 z-40 border-b border-[#E6E1D6] bg-[#FAF8F4]/95 backdrop-blur-sm dark:border-[#1F2E42] dark:bg-[#0A121C]/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single clean wordmark */}
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-[#0F1D2E] dark:text-[#F4F1EA] whitespace-nowrap shrink-0"
          >
            {t.brand.name}
          </Link>

          {/* Zone 2: Clean single-line text links */}
          <nav aria-label={t.nav.mainNavAria} className="hidden lg:flex items-center gap-7">
            <NavLink to="/" end className={navLinkClass}>
              {t.nav.home}
            </NavLink>
            <NavLink to="/schemes" className={navLinkClass}>
              {t.nav.exploreSchemes}
            </NavLink>
            <NavLink to="/how-it-works" className={navLinkClass}>
              {t.nav.howItWorks}
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              {t.nav.aboutUs}
            </NavLink>
          </nav>

          {/* Zone 3: Language, Theme & Primary Action */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#E6E1D6] bg-white px-2.5 py-1.5 dark:border-[#1F2E42] dark:bg-[#111C2B]">
              <Globe className="h-3.5 w-3.5 text-[#5F7F6E] dark:text-[#78A08B]" aria-hidden="true" />
              <label htmlFor="public-lang-select" className="sr-only">
                {t.nav.language}
              </label>
              <select
                id="public-lang-select"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
                className="bg-transparent text-xs font-medium text-[#0F1D2E] focus:outline-none dark:text-[#F4F1EA]"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code} className="bg-white text-[#0F1D2E] dark:bg-[#111C2B] dark:text-[#F4F1EA]">
                    {opt.nativeLabel}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleThemeToggle}
              aria-label={theme === 'light' ? t.nav.themeDark : t.nav.themeLight}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6E1D6] bg-white text-[#465362] transition-colors hover:text-[#0F1D2E] dark:border-[#1F2E42] dark:bg-[#111C2B] dark:text-[#A9B4C2] dark:hover:text-[#F4F1EA]"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {user ? (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-lg bg-[#0F1D2E] px-4 py-2 text-xs font-semibold text-[#FAF8F4] transition-colors hover:bg-[#1C304A] dark:bg-[#CBB07A] dark:text-[#0A121C] dark:hover:bg-[#DEC58E] whitespace-nowrap shrink-0"
              >
                {t.nav.dashboard}
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 text-xs font-semibold text-[#0F1D2E] transition-colors hover:text-[#1F6F78] dark:text-[#F4F1EA] dark:hover:text-[#CBB07A] whitespace-nowrap shrink-0"
                >
                  {t.nav.login}
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-[#0F1D2E] px-4 py-2 text-xs font-semibold text-[#FAF8F4] transition-colors hover:bg-[#1C304A] dark:bg-[#CBB07A] dark:text-[#0A121C] dark:hover:bg-[#DEC58E] whitespace-nowrap shrink-0"
                >
                  {t.nav.register}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={handleThemeToggle}
              aria-label={theme === 'light' ? t.nav.themeDark : t.nav.themeLight}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E6E1D6] bg-white dark:border-[#1F2E42] dark:bg-[#111C2B]"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label={t.nav.toggleMenu}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E6E1D6] bg-white dark:border-[#1F2E42] dark:bg-[#111C2B]"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="border-t border-[#E6E1D6] bg-[#FAF8F4] px-4 py-4 lg:hidden dark:border-[#1F2E42] dark:bg-[#0A121C]">
            <nav aria-label={t.nav.mobileNavAria} className="flex flex-col space-y-2">
              <Link to="/" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5">
                {t.nav.home}
              </Link>
              <Link to="/schemes" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5">
                {t.nav.exploreSchemes}
              </Link>
              <Link to="/how-it-works" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5">
                {t.nav.howItWorks}
              </Link>
              <Link to="/about" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5">
                {t.nav.aboutUs}
              </Link>
              <div className="pt-2 border-t border-[#E6E1D6] dark:border-[#1F2E42]">
                <label htmlFor="mobile-lang-select" className="block text-xs font-medium text-[#5B6777] dark:text-[#A9B4C2] mb-1.5">
                  {t.nav.language}
                </label>
                <select
                  id="mobile-lang-select"
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
                  className="w-full rounded-lg border border-[#E6E1D6] bg-white px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#111C2B]"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label} ({opt.nativeLabel})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                {user ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-lg bg-[#0F1D2E] px-4 py-2.5 text-center text-sm font-semibold text-[#FAF8F4] dark:bg-[#CBB07A] dark:text-[#0A121C]"
                  >
                    {t.nav.dashboard}
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 rounded-lg border border-[#E6E1D6] px-4 py-2.5 text-center text-sm font-semibold dark:border-[#1F2E42]"
                    >
                      {t.nav.login}
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 rounded-lg bg-[#0F1D2E] px-4 py-2.5 text-center text-sm font-semibold text-[#FAF8F4] dark:bg-[#CBB07A] dark:text-[#0A121C]"
                    >
                      {t.nav.register}
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#E6E1D6] bg-white py-12 dark:border-[#1F2E42] dark:bg-[#0D1724]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <p className="font-display text-base font-bold text-[#0F1D2E] dark:text-[#F4F1EA]">
                {t.brand.name}
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#4A5568] dark:text-[#A9B4C2]">
                {t.brand.tagline}
              </p>
              <p className="mt-4 max-w-lg text-xs leading-relaxed text-[#64748B] dark:text-[#8E9BAE]">
                {t.home.disclaimerBody}
              </p>
            </div>
            <div>
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-[#5F7F6E] dark:text-[#78A08B]">
                {t.footer.platformHeading}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-[#4A5568] dark:text-[#A9B4C2]">
                <li><Link to="/schemes" className="hover:text-[#0F1D2E] dark:hover:text-[#F4F1EA]">{t.nav.exploreSchemes}</Link></li>
                <li><Link to="/eligibility" className="hover:text-[#0F1D2E] dark:hover:text-[#F4F1EA]">{t.nav.eligibilityChecker}</Link></li>
                <li><Link to="/how-it-works" className="hover:text-[#0F1D2E] dark:hover:text-[#F4F1EA]">{t.nav.howItWorks}</Link></li>
                <li><Link to="/about" className="hover:text-[#0F1D2E] dark:hover:text-[#F4F1EA]">{t.nav.aboutUs}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-[#5F7F6E] dark:text-[#78A08B]">
                {t.footer.trustLegalHeading}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-[#4A5568] dark:text-[#A9B4C2]">
                <li><Link to="/privacy" className="hover:text-[#0F1D2E] dark:hover:text-[#F4F1EA]">{t.footer.privacyPolicyLink}</Link></li>
                <li><Link to="/terms" className="hover:text-[#0F1D2E] dark:hover:text-[#F4F1EA]">{t.footer.termsLink}</Link></li>
                <li>
                  <a
                    href="https://www.myscheme.gov.in/"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#0F1D2E] dark:hover:text-[#F4F1EA]"
                  >
                    {t.footer.mySchemeLink}
                  </a>
                </li>
                <li>
                  <a
                    href="https://scholarships.gov.in/"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#0F1D2E] dark:hover:text-[#F4F1EA]"
                  >
                    {t.footer.nspLink}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#E6E1D6] pt-6 text-xs text-[#64748B] dark:border-[#1F2E42] dark:text-[#8E9BAE]">
            <span>© {new Date().getFullYear()} {t.footer.copyrightText}</span>
            <span>{t.footer.noAadhaarNote}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
