import fs from 'node:fs';
import path from 'node:path';
import { INITIAL_VERIFIED_SCHEMES } from '../data/verifiedSchemes.ts';
import type {
  AdminAuditLogRecord,
  ApplicationRecord,
  ChatMessageRecord,
  ConversationRecord,
  FeedbackRecord,
  GovernmentScheme,
  NotificationRecord,
  RejectionAnalysisRecord,
  ReminderRecord,
  SavedSchemeRecord,
  UserAccount,
} from '../types/index.ts';

export interface DatabaseSchema {
  users: UserAccount[];
  schemes: GovernmentScheme[];
  applications: ApplicationRecord[];
  savedSchemes: SavedSchemeRecord[];
  notifications: NotificationRecord[];
  conversations: ConversationRecord[];
  messages: ChatMessageRecord[];
  rejectionAnalyses: RejectionAnalysisRecord[];
  reminders: ReminderRecord[];
  feedback: FeedbackRecord[];
  adminAuditLogs: AdminAuditLogRecord[];
  passwordResetTokens: { token: string; userId: string; expiresAt: number }[];
}

const DATA_DIR = path.resolve(process.cwd(), 'backend', 'data');
const DB_PATH = path.join(DATA_DIR, 'yojanasathi-db.json');

function createInitialDb(): DatabaseSchema {
  return {
    users: [],
    schemes: INITIAL_VERIFIED_SCHEMES,
    applications: [],
    savedSchemes: [],
    notifications: [],
    conversations: [],
    messages: [],
    rejectionAnalyses: [],
    reminders: [],
    feedback: [],
    adminAuditLogs: [],
    passwordResetTokens: [],
  };
}

function loadDbFromDisk(): DatabaseSchema {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    const initial = createInitialDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    const base = createInitialDb();
    return {
      users: Array.isArray(parsed.users) ? parsed.users : base.users,
      schemes: Array.isArray(parsed.schemes) && parsed.schemes.length > 0 ? parsed.schemes : base.schemes,
      applications: Array.isArray(parsed.applications) ? parsed.applications : base.applications,
      savedSchemes: Array.isArray(parsed.savedSchemes) ? parsed.savedSchemes : base.savedSchemes,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : base.notifications,
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : base.conversations,
      messages: Array.isArray(parsed.messages) ? parsed.messages : base.messages,
      rejectionAnalyses: Array.isArray(parsed.rejectionAnalyses) ? parsed.rejectionAnalyses : base.rejectionAnalyses,
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : base.reminders,
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : base.feedback,
      adminAuditLogs: Array.isArray(parsed.adminAuditLogs) ? parsed.adminAuditLogs : base.adminAuditLogs,
      passwordResetTokens: Array.isArray(parsed.passwordResetTokens) ? parsed.passwordResetTokens : [],
    };
  } catch {
    const initial = createInitialDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

let dbCache: DatabaseSchema = loadDbFromDisk();
let writeChain: Promise<void> = Promise.resolve();

export function getDb(): DatabaseSchema {
  return dbCache;
}

export async function mutateDb<T>(mutator: (db: DatabaseSchema) => T | Promise<T>): Promise<T> {
  let result!: T;
  writeChain = writeChain.then(async () => {
    result = await mutator(dbCache);
    const tmpPath = `${DB_PATH}.tmp`;
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify(dbCache, null, 2), 'utf8');
    fs.renameSync(tmpPath, DB_PATH);
  });
  await writeChain;
  return result;
}

export function toPublicUser(user: UserAccount) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    themePreference: user.themePreference,
    profile: user.profile,
    notificationPreferences: user.notificationPreferences,
    recentlyViewedSchemeIds: user.recentlyViewedSchemeIds,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
