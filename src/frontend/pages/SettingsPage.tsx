import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Trash2 } from 'lucide-react';
import type { LanguageCode } from '../../../backend/types/index.ts';
import { ErrorBanner } from '../components/UiPrimitives.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { DashboardLayout } from '../layouts/DashboardLayout.tsx';
import { apiRequest, setStoredToken } from '../services/api.ts';
import { LANGUAGE_OPTIONS } from '../translations/index.ts';

export function SettingsPage() {
  const { user, setUser, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLanguage = async (next: LanguageCode) => {
    setLanguage(next);
    try {
      const res = await apiRequest<{ user: typeof user }>('/api/profile/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ preferredLanguage: next }),
      });
      setUser(res.user);
      setFeedback('Language preference updated.');
    } catch {
      // local preference saved
    }
  };

  const handleTheme = async (next: 'light' | 'dark') => {
    setTheme(next);
    try {
      const res = await apiRequest<{ user: typeof user }>('/api/profile/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ themePreference: next }),
      });
      setUser(res.user);
      setFeedback('Theme preference updated.');
    } catch {
      // local preference saved
    }
  };

  const handleExport = async () => {
    setError(null);
    try {
      const data = await apiRequest<Record<string, unknown>>('/api/profile/export-data');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'yojanasathi-my-data.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    }
  };

  const handleClearRecords = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiRequest('/api/profile/personal-records', { method: 'DELETE' });
      setFeedback('Personal saved schemes, applications, chats, and rejection analyses cleared.');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiRequest('/api/auth/account', { method: 'DELETE' });
      setStoredToken(null);
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
      setBusy(false);
    }
  };

  return (
    <DashboardLayout title={t.nav.settings}>
      <div className="max-w-3xl space-y-6">
        <h2 className="font-display text-2xl font-bold">{t.settings.title}</h2>
        {error && <ErrorBanner message={error} />}
        {feedback && (
          <div className="rounded-xl border border-[#3F6B56]/30 bg-[#3F6B56]/10 px-4 py-3 text-xs font-semibold text-[#2E5240] dark:text-[#8CC0A5]">
            {feedback}
          </div>
        )}

        {/* Language & Theme */}
        <section className="rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]">
          <h3 className="font-display text-base font-semibold">{t.settings.appearance}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="settings-lang" className="block text-xs font-semibold">
                {t.nav.language}
              </label>
              <select
                id="settings-lang"
                value={language}
                onChange={(e) => handleLanguage(e.target.value as LanguageCode)}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label} ({opt.nativeLabel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-xs font-semibold">Theme Preference</p>
              <div className="mt-1.5 flex rounded-xl bg-[#EFECE4] p-1 dark:bg-[#0A121C]">
                <button
                  type="button"
                  onClick={() => handleTheme('light')}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                    theme === 'light' ? 'bg-white text-[#0F1D2E] shadow-xs' : 'text-[#5B6777]'
                  }`}
                >
                  {t.nav.themeLight}
                </button>
                <button
                  type="button"
                  onClick={() => handleTheme('dark')}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                    theme === 'dark' ? 'bg-[#1C2D42] text-[#F4F1EA] shadow-xs' : 'text-[#5B6777]'
                  }`}
                >
                  {t.nav.themeDark}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* DPDP Data & Account Deletion */}
        <section className="rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]">
          <h3 className="font-display text-base font-semibold">{t.settings.dataPrivacy}</h3>
          <p className="mt-1.5 text-xs text-[#465362] dark:text-[#A9B4C2]">{t.settings.deleteWarning}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E6E1D6] px-4 py-2.5 text-xs font-semibold hover:bg-[#FAF8F4] dark:border-[#1F2E42] dark:hover:bg-[#19293D]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t.settings.exportData}</span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={handleClearRecords}
              className="inline-flex items-center gap-2 rounded-xl border border-[#9A712A]/40 px-4 py-2.5 text-xs font-semibold text-[#9A712A] hover:bg-[#9A712A]/10 dark:text-[#D7B673]"
            >
              <span>{t.settings.clearRecords}</span>
            </button>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#9E3B3B]/40 px-4 py-2.5 text-xs font-semibold text-[#9E3B3B] hover:bg-[#9E3B3B]/10 dark:text-[#E58A8A]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{t.settings.deleteAccount}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDeleteAccount}
                  className="rounded-xl bg-[#9E3B3B] px-4 py-2.5 text-xs font-semibold text-white"
                >
                  Confirm Permanent Deletion
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-xl border border-[#E6E1D6] px-3 py-2.5 text-xs"
                >
                  {t.common.cancel}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
