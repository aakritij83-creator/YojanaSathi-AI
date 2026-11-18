import React, { useCallback, useEffect, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import type { NotificationPreferences, NotificationRecord, ReminderRecord } from '../../../backend/types/index.ts';
import { ErrorBanner, LoadingSkeleton } from '../components/UiPrimitives.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { DashboardLayout } from '../layouts/DashboardLayout.tsx';
import { apiRequest } from '../services/api.ts';
import { localizeSystemNotification } from '../translations/domainLabels.ts';

export function NotificationsPage() {
  const { language, t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [remTitle, setRemTitle] = useState('');
  const [remDate, setRemDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nRes, rRes] = await Promise.all([
        apiRequest<{ items: NotificationRecord[]; preferences: NotificationPreferences }>('/api/notifications'),
        apiRequest<{ items: ReminderRecord[] }>('/api/reminders'),
      ]);
      setNotifications(nRes.items);
      setPrefs(nRes.preferences);
      setReminders(rRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [t.common.errorGeneric]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const markRead = async (id: string) => {
    await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    await apiRequest('/api/notifications/read-all', { method: 'POST' });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = async (id: string) => {
    await apiRequest(`/api/notifications/${id}`, { method: 'DELETE' });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const updatePrefs = async (next: NotificationPreferences) => {
    setPrefs(next);
    await apiRequest('/api/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(next),
    });
  };

  const addReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim() || !remDate) return;
    const res = await apiRequest<{ item: ReminderRecord }>('/api/reminders', {
      method: 'POST',
      body: JSON.stringify({ title: remTitle.trim(), dueDate: remDate }),
    });
    setReminders((prev) => [...prev, res.item]);
    setRemTitle('');
    setRemDate('');
    loadAll();
  };

  const toggleReminder = async (r: ReminderRecord) => {
    const res = await apiRequest<{ item: ReminderRecord }>(`/api/reminders/${r.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !r.completed }),
    });
    setReminders((prev) => prev.map((x) => (x.id === r.id ? res.item : x)));
  };

  const deleteReminder = async (id: string) => {
    await apiRequest(`/api/reminders/${id}`, { method: 'DELETE' });
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <DashboardLayout title={t.nav.notifications}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">{t.notifications.title}</h2>
            <p className="mt-1 text-sm text-[#465362] dark:text-[#A9B4C2]">{t.notifications.subtitle}</p>
          </div>
          {notifications.some((n) => !n.isRead) && (
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-xl border border-[#E6E1D6] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#FAF8F4] dark:border-[#1F2E42] dark:bg-[#111C2B]"
            >
              {t.notifications.markAllRead}
            </button>
          )}
        </div>

        {error && <ErrorBanner message={error} onRetry={loadAll} />}

        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Notifications Feed */}
            <section className="rounded-2xl border border-[#E6E1D6] bg-white p-6 lg:col-span-7 dark:border-[#1F2E42] dark:bg-[#111C2B]">
              <h3 className="font-display text-base font-semibold">{t.nav.notifications}</h3>
              {notifications.length === 0 ? (
                <p className="mt-4 text-sm text-[#64748B]">{t.notifications.emptyNotifications}</p>
              ) : (
                <ul className="mt-4 divide-y divide-[#E6E1D6] dark:divide-[#1F2E42]">
                  {notifications.map((n) => {
                    const locNotif = localizeSystemNotification(n, language);
                    return (
                      <li key={n.id} className={`py-3.5 first:pt-0 last:pb-0 ${n.isRead ? 'opacity-65' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{locNotif.title}</p>
                            <p className="mt-1 text-xs text-[#465362] dark:text-[#A9B4C2]">{locNotif.message}</p>
                            <p className="mt-1 font-mono text-[11px] text-[#64748B]">{n.createdAt.slice(0, 10)}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {!n.isRead && (
                              <button
                                type="button"
                                onClick={() => markRead(n.id)}
                                aria-label={`${t.notifications.markReadAria}: ${locNotif.title}`}
                                className="rounded-lg p-1.5 text-[#1F6F78] hover:bg-[#FAF8F4]"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteNotification(n.id)}
                              aria-label={`${t.notifications.deleteNotifAria}: ${locNotif.title}`}
                              className="rounded-lg p-1.5 text-[#9E3B3B] hover:bg-[#9E3B3B]/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Personal Reminders & Preferences */}
            <div className="space-y-6 lg:col-span-5">
              <section className="rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]">
                <h3 className="font-display text-base font-semibold">{t.notifications.addReminder}</h3>
                <form onSubmit={addReminder} className="mt-4 space-y-3">
                  <input
                    type="text"
                    required
                    value={remTitle}
                    onChange={(e) => setRemTitle(e.target.value)}
                    placeholder={t.notifications.reminderTitle}
                    aria-label={t.notifications.reminderTitle}
                    className="w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      required
                      value={remDate}
                      onChange={(e) => setRemDate(e.target.value)}
                      aria-label={t.notifications.dueDate}
                      className="flex-1 rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3 py-2 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-xl bg-[#0F1D2E] px-4 py-2 text-xs font-semibold text-[#FAF8F4] dark:bg-[#CBB07A] dark:text-[#0A121C]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{t.notifications.addBtn}</span>
                    </button>
                  </div>
                </form>

                {reminders.length === 0 ? (
                  <p className="mt-4 text-xs text-[#64748B]">{t.notifications.emptyReminders}</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {reminders.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={r.completed}
                            onChange={() => toggleReminder(r)}
                            className="h-4 w-4 rounded accent-[#1F6F78]"
                          />
                          <span className={r.completed ? 'line-through opacity-60' : ''}>
                            {r.title} <span className="font-mono text-[#64748B]">({r.dueDate})</span>
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => deleteReminder(r.id)}
                          aria-label={`${t.notifications.deleteReminderAria}: ${r.title}`}
                          className="text-[#9E3B3B]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {prefs && (
                <section className="rounded-2xl border border-[#E6E1D6] bg-white p-6 dark:border-[#1F2E42] dark:bg-[#111C2B]">
                  <h3 className="font-display text-base font-semibold">{t.notifications.preferences}</h3>
                  <div className="mt-3 space-y-2.5 text-xs">
                    {(
                      [
                        ['statusChanges', t.notifications.prefStatusChanges],
                        ['upcomingDeadlines', t.notifications.prefUpcomingDeadlines],
                        ['incompletePreparation', t.notifications.prefIncompletePrep],
                        ['profileReminders', t.notifications.prefProfileReminders],
                        ['schemeUpdates', t.notifications.prefSchemeUpdates],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={prefs[key]}
                          onChange={(e) => updatePrefs({ ...prefs, [key]: e.target.checked })}
                          className="h-4 w-4 rounded accent-[#1F6F78]"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
