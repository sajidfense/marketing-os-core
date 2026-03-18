import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/**
 * JWT payload shape emitted by Supabase Auth.
 * Only the fields we actually inspect are listed here.
 */
interface SupabaseJwtPayload {
  /** User UUID */
  sub: string;
  /** Audience */
  aud: string;
  /** Issued-at (epoch seconds) */
  iat: number;
  /** Expiry (epoch seconds) */
  exp: number;
  /** User's email (optional) */
  email?: string;
  /** Role claim set by Supabase */
  role?: string;
}

/**
 * Verifies the Bearer JWT using the Supabase JWT secret directly
 * (no network call to supabase.auth.getUser).
 *
 * On success, sets `req.userId` to the `sub` claim.
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
    const decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET, {
      algorithms: ['HS256'],
    }) as SupabaseJwtPayload;

    if (!decoded.sub) {
      res.status(401).json({ error: 'Token missing subject claim' });
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

    // Unexpected verification error
    console.error('[auth] Token verification failed:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
}
