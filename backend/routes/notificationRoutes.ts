import { Router } from 'express';
import { z } from 'zod';
import { getDb, mutateDb } from '../db/store.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { requireAuth } from '../middleware/auth.ts';
import { generateId } from '../utils/security.ts';

const router = Router();

router.get('/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const items = getDb()
    .notifications.filter((n) => n.userId === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return res.json({
    items,
    preferences: req.authUser!.notificationPreferences,
  });
});

router.patch('/notifications/:id/read', requireAuth, async (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const id = req.params.id;
  const updated = await mutateDb((db) => {
    const item = db.notifications.find((n) => n.id === id && n.userId === uid);
    if (!item) return null;
    item.isRead = true;
    return item;
  });
  if (!updated) return res.status(404).json({ error: 'Notification not found.' });
  return res.json({ item: updated });
});

router.post('/notifications/read-all', requireAuth, async (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  await mutateDb((db) => {
    db.notifications.forEach((n) => {
      if (n.userId === uid) n.isRead = true;
    });
  });
  return res.json({ ok: true });
});

router.delete('/notifications/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const id = req.params.id;
  await mutateDb((db) => {
    db.notifications = db.notifications.filter((n) => !(n.id === id && n.userId === uid));
  });
  return res.json({ ok: true });
});

router.put('/notifications/preferences', requireAuth, async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    statusChanges: z.boolean(),
    upcomingDeadlines: z.boolean(),
    incompletePreparation: z.boolean(),
    profileReminders: z.boolean(),
    schemeUpdates: z.boolean(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid notification preferences.' });

  const uid = req.authUser!.id;
  await mutateDb((db) => {
    const user = db.users.find((u) => u.id === uid);
    if (user) {
      user.notificationPreferences = parsed.data;
      user.updatedAt = new Date().toISOString();
    }
  });
  return res.json({ preferences: parsed.data });
});

// --- Personal Reminders ---
router.get('/reminders', requireAuth, (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const items = getDb()
    .reminders.filter((r) => r.userId === uid)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return res.json({ items });
});

router.post('/reminders', requireAuth, async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    title: z.string().trim().min(2, 'Reminder title is required.').max(180),
    dueDate: z.string().min(4, 'Due date is required.').max(32),
    schemeId: z.string().max(80).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid reminder.' });
  }

  const uid = req.authUser!.id;
  const now = new Date().toISOString();
  const record = {
    id: generateId('rem'),
    userId: uid,
    title: parsed.data.title,
    dueDate: parsed.data.dueDate,
    schemeId: parsed.data.schemeId,
    completed: false,
    createdAt: now,
  };

  await mutateDb((db) => {
    db.reminders.push(record);
    db.notifications.push({
      id: generateId('notif'),
      userId: uid,
      type: 'personal_reminder',
      title: `Reminder scheduled: ${record.title}`,
      message: `Scheduled for ${record.dueDate} (in-app reminder).`,
      relatedSchemeId: record.schemeId,
      isRead: false,
      createdAt: now,
    });
  });

  return res.status(201).json({ item: record });
});

router.patch('/reminders/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const id = req.params.id;
  const completed = typeof req.body?.completed === 'boolean' ? req.body.completed : undefined;

  const updated = await mutateDb((db) => {
    const rem = db.reminders.find((r) => r.id === id && r.userId === uid);
    if (!rem) return null;
    if (completed !== undefined) rem.completed = completed;
    return rem;
  });

  if (!updated) return res.status(404).json({ error: 'Reminder not found.' });
  return res.json({ item: updated });
});

router.delete('/reminders/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const id = req.params.id;
  await mutateDb((db) => {
    db.reminders = db.reminders.filter((r) => !(r.id === id && r.userId === uid));
  });
  return res.json({ ok: true });
});

export default router;
