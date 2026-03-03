import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase.client';
import { AuthenticatedRequest } from './auth.middleware';

export async function organizationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const orgId =
    (req.headers['x-organization-id'] as string) ??
    req.query.organizationId as string;

  if (!orgId) {
    res.status(400).json({ error: 'x-organization-id header is required' });
    return;
  }

  // Verify membership
  const { data, error } = await supabase
    .from('organization_users')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', authReq.userId)
    .single();

  if (error || !data) {
    res.status(403).json({ error: 'Access denied to this organization' });
    return;
  }

  authReq.organizationId = orgId;
  authReq.userRole = data.role;
  next();
}
