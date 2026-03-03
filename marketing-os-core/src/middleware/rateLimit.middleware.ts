import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase.client';
import { AuthenticatedRequest } from './auth.middleware';

// ── Global rate limiter (all routes) ───────────────────────────
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});

// ── Per-user daily generation cap ──────────────────────────────
export async function userDailyCapMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const cap = Number(process.env.DAILY_USER_GENERATION_CAP ?? 50);
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('ai_usage')
    .select('id')
    .eq('user_id', authReq.userId)
    .eq('period_day', today);

  if (error) {
    res.status(500).json({ error: 'Usage check failed' });
    return;
  }

  if ((data?.length ?? 0) >= cap) {
    res.status(429).json({
      error: 'Daily generation limit reached',
      limit: cap,
      resets: 'midnight UTC',
    });
    return;
  }

  next();
}

// ── Per-org monthly token cap ───────────────────────────────────
export async function orgMonthlyTokenCapMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const cap = Number(process.env.MONTHLY_ORG_TOKEN_CAP ?? 5_000_000);
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  const monthStart = firstOfMonth.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('ai_usage')
    .select('tokens_used')
    .eq('organization_id', authReq.organizationId)
    .gte('period_day', monthStart);

  if (error) {
    res.status(500).json({ error: 'Usage check failed' });
    return;
  }

  const totalTokens = (data ?? []).reduce((sum, row) => sum + (row.tokens_used ?? 0), 0);

  if (totalTokens >= cap) {
    res.status(429).json({
      error: 'Monthly organization token limit reached',
      limit: cap,
      used: totalTokens,
    });
    return;
  }

  next();
}
