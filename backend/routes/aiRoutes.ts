import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { analyzeRejectionNotice, generateAssistantReply, mapGeminiError } from '../ai/geminiService.ts';
import { getDb, mutateDb } from '../db/store.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { requireAuth } from '../middleware/auth.ts';
import { createAiRateLimiter } from '../middleware/rateLimit.ts';
import { evaluateAllSchemes } from '../services/eligibilityEngine.ts';
import type { LanguageCode } from '../types/index.ts';
import { generateId } from '../utils/security.ts';

const router = Router();
const aiRateLimiter = createAiRateLimiter(25, 10 * 60 * 1000);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
});

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);

function validateFileMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (!buffer || buffer.length < 8) return false;
  if (mimeType === 'application/pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  if (mimeType === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

// --- Conversations & Chat ---
router.get('/conversations', requireAuth, (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const items = getDb()
    .conversations.filter((c) => c.userId === uid)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return res.json({ items });
});

router.post('/conversations', requireAuth, async (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const now = new Date().toISOString();
  const lang = (['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu'].includes(req.body?.language)
    ? req.body.language
    : req.authUser!.preferredLanguage) as LanguageCode;

  const conv = {
    id: generateId('conv'),
    userId: uid,
    title: typeof req.body?.title === 'string' && req.body.title.trim() ? req.body.title.trim().slice(0, 80) : 'New Guidance Session',
    language: lang,
    createdAt: now,
    updatedAt: now,
  };

  await mutateDb((db) => {
    db.conversations.push(conv);
  });

  return res.status(201).json({ item: conv });
});

router.get('/conversations/:id/messages', requireAuth, (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const convId = req.params.id;
  const db = getDb();
  const conv = db.conversations.find((c) => c.id === convId && c.userId === uid);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

  const messages = db.messages
    .filter((m) => m.conversationId === convId && m.userId === uid)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return res.json({ conversation: conv, messages });
});

router.delete('/conversations/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const convId = req.params.id;
  await mutateDb((db) => {
    db.conversations = db.conversations.filter((c) => !(c.id === convId && c.userId === uid));
    db.messages = db.messages.filter((m) => !(m.conversationId === convId && m.userId === uid));
  });
  return res.json({ ok: true });
});

router.post('/chat', requireAuth, aiRateLimiter, async (req: AuthenticatedRequest, res) => {
  const schema = z.object({
    conversationId: z.string().optional(),
    message: z.string().trim().min(1, 'Message cannot be empty.').max(2000),
    language: z.enum(['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu']).optional(),
    includeProfile: z.boolean().optional().default(true),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid chat input.' });
  }

  const user = req.authUser!;
  const uid = user.id;
  const db = getDb();
  const language = (parsed.data.language || user.preferredLanguage || 'en') as LanguageCode;
  const now = new Date().toISOString();

  let conversation = parsed.data.conversationId
    ? db.conversations.find((c) => c.id === parsed.data.conversationId && c.userId === uid)
    : undefined;

  if (!conversation) {
    conversation = {
      id: generateId('conv'),
      userId: uid,
      title: parsed.data.message.slice(0, 56),
      language,
      createdAt: now,
      updatedAt: now,
    };
    await mutateDb((state) => {
      state.conversations.push(conversation!);
    });
  }

  const history = db.messages
    .filter((m) => m.conversationId === conversation!.id && m.userId === uid)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const activeSchemes = db.schemes.filter((s) => s.verificationStatus !== 'Archived' && s.verificationStatus !== 'Draft');
  const eligibilityResults = parsed.data.includeProfile
    ? evaluateAllSchemes(user.profile, activeSchemes)
    : undefined;

  try {
    const reply = await generateAssistantReply({
      userMessage: parsed.data.message,
      history,
      language,
      userProfile: parsed.data.includeProfile ? user.profile : null,
      schemes: activeSchemes,
      eligibilityResults,
    });

    const userMsg = {
      id: generateId('msg'),
      conversationId: conversation.id,
      userId: uid,
      role: 'user' as const,
      content: parsed.data.message,
      createdAt: now,
    };
    const assistantMsg = {
      id: generateId('msg'),
      conversationId: conversation.id,
      userId: uid,
      role: 'assistant' as const,
      content: reply.answer,
      citations: reply.citations,
      createdAt: new Date().toISOString(),
    };

    await mutateDb((state) => {
      state.messages.push(userMsg, assistantMsg);
      const conv = state.conversations.find((c) => c.id === conversation!.id);
      if (conv) {
        if (conv.title === 'New Guidance Session') {
          conv.title = parsed.data.message.slice(0, 56);
        }
        conv.language = language;
        conv.updatedAt = assistantMsg.createdAt;
      }
    });

    return res.json({
      conversationId: conversation.id,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      couldVerify: reply.couldVerify,
    });
  } catch (error) {
    const mapped = mapGeminiError(error);
    return res.status(mapped.status).json({
      error: mapped.message,
      code: mapped.code,
      conversationId: conversation.id,
    });
  }
});

// --- Understand My Rejection Analyzer ---
router.get('/rejection-analyses', requireAuth, (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const items = getDb()
    .rejectionAnalyses.filter((r) => r.userId === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return res.json({ items });
});

router.delete('/rejection-analyses/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const uid = req.authUser!.id;
  const id = req.params.id;
  await mutateDb((db) => {
    db.rejectionAnalyses = db.rejectionAnalyses.filter((r) => !(r.id === id && r.userId === uid));
  });
  return res.json({ ok: true });
});

router.post('/analyze-rejection', requireAuth, aiRateLimiter, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.message || 'Uploaded file exceeds the 5 MB limit or is invalid.',
      });
    }
    next();
  });
}, async (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const rawText = typeof req.body?.rawText === 'string' ? req.body.rawText.trim() : '';
  const schemeNameHint = typeof req.body?.schemeNameHint === 'string' ? req.body.schemeNameHint.trim().slice(0, 140) : '';
  const language = (['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu'].includes(req.body?.language)
    ? req.body.language
    : user.preferredLanguage || 'en') as LanguageCode;
  const file = req.file;

  if (!file && !rawText) {
    return res.status(400).json({
      error: 'Please upload a PDF/image rejection notice or paste the rejection notice text.',
    });
  }

  let inputType: 'pdf' | 'image' | 'text' = 'text';
  if (file) {
    if (file.size === 0) {
      return res.status(400).json({ error: 'The uploaded file is empty (0 bytes).' });
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return res.status(400).json({
        error: 'Unsupported file format. Please upload a PDF, PNG, JPG, or WEBP file.',
      });
    }
    if (!validateFileMagicBytes(file.buffer, file.mimetype)) {
      return res.status(400).json({
        error: 'The uploaded file appears corrupted or does not match its declared PDF/image format.',
      });
    }
    inputType = file.mimetype === 'application/pdf' ? 'pdf' : 'image';
  } else if (rawText.length < 10) {
    return res.status(400).json({
      error: 'Please paste a complete rejection message (at least 10 characters).',
    });
  }

  try {
    const analysis = await analyzeRejectionNotice({
      fileBuffer: file?.buffer,
      mimeType: file?.mimetype,
      rawText: rawText || undefined,
      schemeNameHint: schemeNameHint || undefined,
      language,
    });

    const record = {
      id: generateId('rej'),
      userId: user.id,
      fileName: file?.originalname,
      inputType,
      schemeNameHint: schemeNameHint || undefined,
      result: analysis,
      createdAt: new Date().toISOString(),
    };

    await mutateDb((db) => {
      db.rejectionAnalyses.push(record);
    });

    return res.status(201).json({ item: record });
  } catch (error) {
    const mapped = mapGeminiError(error);
    return res.status(mapped.status).json({
      error: mapped.message,
      code: mapped.code,
    });
  }
});

export default router;
