import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from './auth.ts';

interface RateBucket {
  timestamps: number[];
}

const buckets = new Map<string, RateBucket>();

export function createAiRateLimiter(maxRequests = 20, windowMs = 10 * 60 * 1000) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const key = req.authUser?.id || req.ip || 'anonymous';
    const now = Date.now();
    const bucket = buckets.get(key) || { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);

    if (bucket.timestamps.length >= maxRequests) {
      const oldest = bucket.timestamps[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        error: `AI request rate limit reached. Please wait ${retryAfterSeconds} seconds before trying again.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds,
      });
    }

    bucket.timestamps.push(now);
    buckets.set(key, bucket);
    next();
  };
}
