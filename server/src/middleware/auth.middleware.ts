import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

/**
 * Per-request Supabase client using the anon key.
 * We pass the user's Bearer token to getUser() for validation —
 * Supabase verifies the JWT server-side and returns the user.
 */
const supabaseAuth = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

/**
 * Validates the Bearer JWT by calling supabase.auth.getUser(token).
 * This is the recommended approach — no manual jwt.verify, no secret needed.
 *
 * On success, sets `req.userId` to the authenticated user's ID.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.userId = user.id;
    next();
  } catch (err) {
    console.error('[auth] Token validation failed:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
}
