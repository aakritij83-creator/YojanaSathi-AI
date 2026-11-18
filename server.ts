import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { attachAuth } from './backend/middleware/auth.ts';
import adminRoutes from './backend/routes/adminRoutes.ts';
import aiRoutes from './backend/routes/aiRoutes.ts';
import applicationRoutes from './backend/routes/applicationRoutes.ts';
import authRoutes from './backend/routes/authRoutes.ts';
import notificationRoutes from './backend/routes/notificationRoutes.ts';
import profileRoutes from './backend/routes/profileRoutes.ts';
import schemeRoutes from './backend/routes/schemeRoutes.ts';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(attachAuth);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'YojanaSathi AI',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/export/zip', (_req, res) => {
    const zipPath = path.resolve(process.cwd(), 'YojanaSathi-AI.zip');
    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({
        error: 'Export archive has not been generated yet.',
      });
    }
    return res.download(zipPath, 'YojanaSathi-AI.zip');
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/schemes', schemeRoutes);
  app.use('/api/eligibility', schemeRoutes);
  app.use('/api', applicationRoutes);
  app.use('/api', notificationRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api', adminRoutes);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  return app;
}

async function startServer() {
  const app = createApp();
  const port = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`YojanaSathi AI server listening on http://0.0.0.0:${port}`);
  });
}

const isDirectExecution =
  process.argv[1] &&
  (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'));

if (isDirectExecution) {
  startServer().catch((err) => {
    console.error('Failed to start YojanaSathi AI server:', err);
    process.exit(1);
  });
}
