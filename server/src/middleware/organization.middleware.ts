import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

/**
 * Resolves and validates the active organization for the request.
 *
 * 1. Reads `x-organization-id` header (preferred) or `organizationId` query param.
 * 2. Verifies the authenticated user is a member of that organization.
 * 3. Sets `req.organizationId` and `req.userRole` on the typed Request.
 *
 * Must run AFTER `authMiddleware` (requires `req.userId`).
 */
export async function organizationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const orgId =
    (req.headers['x-organization-id'] as string | undefined) ??
    (req.query.organizationId as string | undefined);

  if (!orgId) {
    res.status(400).json({
      error: 'x-organization-id header or organizationId query parameter is required',
    });
    return;
  }

  // Validate UUID format to avoid unnecessary DB round-trips
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(orgId)) {
    res.status(400).json({ error: 'Invalid organization ID format' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('organization_users')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', req.userId)
      .single();

    if (error || !data) {
      res.status(403).json({ error: 'Access denied to this organization' });
      return;
    }

    req.organizationId = orgId;
    req.userRole = data.role;
    next();
  } catch (err) {
    console.error('[org-middleware] Membership lookup failed:', err);
    res.status(500).json({ error: 'Organization verification failed' });
  }
}
