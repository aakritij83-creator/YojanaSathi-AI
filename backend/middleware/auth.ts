import type { NextFunction, Request, Response } from 'express';
import { getDb, toPublicUser } from '../db/store.ts';
import type { UserAccount } from '../types/index.ts';
import { verifySessionToken } from '../utils/security.ts';

export interface AuthenticatedRequest extends Request {
  authUser?: UserAccount;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const parts = cookieHeader.split(';').map((c) => c.trim());
    for (const part of parts) {
      if (part.startsWith('ys_session=')) {
        return decodeURIComponent(part.slice('ys_session='.length));
      }
    }
  }
  return null;
}

export function attachAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return next();
  }
  const payload = verifySessionToken(token);
  if (!payload) {
    return next();
  }
  const db = getDb();
  const user = db.users.find((u) => u.id === payload.uid);
  if (user) {
    req.authUser = user;
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.authUser) {
    return res.status(401).json({
      error: 'Authentication required. Please log in to continue.',
    });
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.authUser) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.authUser.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied. Administrator privileges are required for this resource.',
    });
  }
  next();
}

export function sanitizeAuthUserResponse(user: UserAccount) {
  return toPublicUser(user);
}
