import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { supabase } from '../lib/supabase';

interface SupabaseJwtPayload {
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  email?: string;
  role?: string;
}

/**
 * Middleware that protects admin provisioning routes.
 *
 * Two authentication strategies (checked in order):
 *
 * 1. **ADMIN_SECRET header** — the `x-admin-secret` header matches the
 *    configured ADMIN_SECRET env var.  Used for server-to-server / CLI calls
 *    where no user session exists.
 *
 * 2. **JWT + super_admin role** — a valid Supabase JWT whose `sub` (user_id)
 *    has a `super_admin` role in *any* organization_users row.
 */
export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // ── Strategy 1: shared secret ────────────────────────────────────
  const adminSecret = req.headers['x-admin-secret'] as string | undefined;

  if (adminSecret && env.ADMIN_SECRET) {
    if (timingSafeEqual(adminSecret, env.ADMIN_SECRET)) {
      return next();
    }
    res.status(401).json({ error: 'Invalid admin secret' });
    return;
  }

  // ── Strategy 2: JWT + super_admin role ───────────────────────────
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Admin authentication required' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET, {
      algorithms: ['HS256'],
    }) as SupabaseJwtPayload;

    if (!decoded.sub) {
      res.status(401).json({ error: 'Token missing subject claim' });
      return;
    }

    // Check if user has super_admin role in any org
    const { data, error } = await supabase
      .from('organization_users')
      .select('role')
      .eq('user_id', decoded.sub)
      .eq('role', 'super_admin')
      .limit(1);

    if (error || !data || data.length === 0) {
      res.status(403).json({ error: 'Insufficient privileges — super_admin role required' });
      return;
    }

    req.userId = decoded.sub;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token has expired' });
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    console.error('[admin-middleware] Verification failed:', err);
    res.status(401).json({ error: 'Admin authentication failed' });
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
