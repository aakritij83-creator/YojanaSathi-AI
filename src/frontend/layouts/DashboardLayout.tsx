import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  Bot,
  CheckSquare,
  Compass,
  FileWarning,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  SlidersHorizontal,
  Sun,
  User,
  X,
} from 'lucide-react';
import type { LanguageCode } from '../../../backend/types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { apiRequest } from '../services/api.ts';
import { LANGUAGE_OPTIONS } from '../translations/index.ts';

export function DashboardLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, logout, setUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

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
        // local state updated
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
        // local state updated
      }
    }
  };

  const navItems = [
    { to: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { to: '/schemes', label: t.nav.discoverSchemes, icon: Compass },
    { to: '/eligibility', label: t.nav.eligibilityChecker, icon: CheckSquare },
    { to: '/assistant', label: t.nav.aiAssistant, icon: Bot },
    { to: '/tracker', label: t.nav.applicationTracker, icon: SlidersHorizontal },
    { to: '/rejection-analyzer', label: t.nav.rejectionAnalyzer, icon: FileWarning },
    { to: '/saved', label: t.nav.savedSchemes, icon: Bookmark },
    { to: '/notifications', label: t.nav.notifications, icon: Bell },
    { to: '/profile', label: t.nav.myProfile, icon: User },
    { to: '/settings', label: t.nav.settings, icon: Settings },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-[#0F1D2E] text-[#FAF8F4] dark:bg-[#CBB07A] dark:text-[#0A121C]'
        : 'text-[#465362] hover:bg-[#EFECE4] hover:text-[#0F1D2E] dark:text-[#A9B4C2] dark:hover:bg-[#172538] dark:hover:text-[#F4F1EA]'
    }`;

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        <div className="mb-6 flex items-center justify-between px-2">
          <Link to="/" className="font-display text-lg font-bold tracking-tight text-[#0F1D2E] dark:text-[#F4F1EA]">
            {t.brand.name}
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 lg:hidden hover:bg-black/5 dark:hover:bg-white/10"
            aria-label={t.nav.closeSidebar}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label={t.nav.dashboardNavAria} className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={linkClass}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className={linkClass}
            >
              <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{t.nav.adminConsole}</span>
            </NavLink>
          )}
        </nav>
      </div>

      <div className="mt-6 border-t border-[#E6E1D6] pt-4 dark:border-[#1F2E42]">
        <div className="mb-3 px-2">
          <p className="truncate text-xs font-semibold text-[#0F1D2E] dark:text-[#F4F1EA]">
            {user?.profile.fullName}
          </p>
          <p className="truncate text-xs text-[#64748B] dark:text-[#8E9BAE]">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#9E3B3B] transition-colors hover:bg-[#9E3B3B]/10 dark:text-[#E58A8A]"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t.nav.logout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#FAF8F4] text-[#0F1D2E] dark:bg-[#0A121C] dark:text-[#F4F1EA]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-[#E6E1D6] bg-white lg:block dark:border-[#1F2E42] dark:bg-[#0E1826]">
        <div className="sticky top-0 h-screen overflow-y-auto">{SidebarContent}</div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-white shadow-xl dark:bg-[#0E1826]">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#E6E1D6] bg-[#FAF8F4]/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8 dark:border-[#1F2E42] dark:bg-[#0A121C]/95">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t.nav.openSidebar}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E6E1D6] bg-white lg:hidden dark:border-[#1F2E42] dark:bg-[#111C2B]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="truncate font-display text-base font-semibold text-[#0F1D2E] sm:text-lg dark:text-[#F4F1EA]">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#E6E1D6] bg-white px-2.5 py-1.5 dark:border-[#1F2E42] dark:bg-[#111C2B]">
              <Globe className="h-3.5 w-3.5 text-[#5F7F6E] dark:text-[#78A08B]" aria-hidden="true" />
              <label htmlFor="dash-lang-select" className="sr-only">
                {t.nav.language}
              </label>
              <select
                id="dash-lang-select"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
                className="bg-transparent text-xs font-medium focus:outline-none"
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6E1D6] bg-white text-[#465362] hover:text-[#0F1D2E] dark:border-[#1F2E42] dark:bg-[#111C2B] dark:text-[#A9B4C2] dark:hover:text-[#F4F1EA]"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
