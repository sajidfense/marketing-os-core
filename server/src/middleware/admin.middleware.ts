import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { supabase } from '../lib/supabase';

const supabaseAuth = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

/**
 * Middleware that protects admin provisioning routes.
 *
 * Two authentication strategies (checked in order):
 *
 * 1. **ADMIN_SECRET header** — the `x-admin-secret` header matches the
 *    configured ADMIN_SECRET env var.  Used for server-to-server / CLI calls
 *    where no user session exists.
 *
 * 2. **Supabase getUser + super_admin role** — validates the Bearer token
 *    via Supabase, then checks if the user has a `super_admin` role.
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

  // ── Strategy 2: Supabase getUser + super_admin role ──────────────
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Admin authentication required' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Check if user has super_admin role in any org
    const { data, error: roleError } = await supabase
      .from('organization_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .limit(1);

    if (roleError || !data || data.length === 0) {
      res.status(403).json({ error: 'Insufficient privileges — super_admin role required' });
      return;
    }

    req.userId = user.id;
    next();
  } catch (err) {
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
