import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

/**
 * Resolves the organization from the authenticated user's membership.
 *
 * - Looks up the user's organization_users row to find their org
 * - If user has multiple orgs, uses the first one (multi-org switching can be added later)
 * - Sets `req.organizationId` and `req.userRole` on the typed Request
 * - NEVER trusts organization ID from the frontend
 *
 * Must run AFTER `authMiddleware` (requires `req.userId`).
 */
export async function organizationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('organization_users')
      .select('organization_id, role')
      .eq('user_id', req.userId)
      .limit(1)
      .single();

    if (error || !data) {
      res.status(403).json({ error: 'User not assigned to any organization' });
      return;
    }

    req.organizationId = data.organization_id;
    req.userRole = data.role;
    next();
  } catch (err) {
    console.error('[org-middleware] Organization lookup failed:', err);
    res.status(500).json({ error: 'Organization resolution failed' });
  }
}
