import { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../services/supabase.client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { getOrgUsageSummary } from '../services/usage.service';

const brandingSchema = z.object({
  logo_url:           z.string().url().optional(),
  favicon_url:        z.string().url().optional(),
  primary_color:      z.string().optional(),
  accent_color:       z.string().optional(),
  custom_domain:      z.string().optional(),
  app_name:           z.string().optional(),
  email_from_name:    z.string().optional(),
  email_from_address: z.string().email().optional(),
  support_email:      z.string().email().optional(),
});

export async function getOrgSettings(req: Request, res: Response): Promise<void> {
  const { organizationId } = req as AuthenticatedRequest;
  const [orgResult, brandingResult] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', organizationId).single(),
    supabase.from('branding_settings').select('*').eq('organization_id', organizationId).single(),
  ]);
  res.json({ success: true, data: { organization: orgResult.data, branding: brandingResult.data ?? null } });
}

export async function updateBranding(req: Request, res: Response): Promise<void> {
  const { organizationId, userRole } = req as AuthenticatedRequest;
  if (!['owner', 'admin'].includes(userRole)) {
    res.status(403).json({ error: 'Only owners and admins can update branding' });
    return;
  }
  const body = brandingSchema.parse(req.body);
  const { data, error } = await supabase
    .from('branding_settings')
    .upsert({ ...body, organization_id: organizationId }, { onConflict: 'organization_id' })
    .select().single();
  if (error) throw error;
  res.json({ success: true, data });
}

export async function getUsage(req: Request, res: Response): Promise<void> {
  const { organizationId } = req as AuthenticatedRequest;
  const days = Math.min(Number(req.query.days ?? 30), 90);
  const data = await getOrgUsageSummary(organizationId, days);
  res.json({ success: true, data });
}

export async function inviteMember(req: Request, res: Response): Promise<void> {
  const { organizationId, userRole } = req as AuthenticatedRequest;
  if (!['owner', 'admin'].includes(userRole)) {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }
  const { email, role = 'member' } = z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'member']).optional(),
  }).parse(req.body);

  const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
  if (!user) {
    res.status(404).json({ error: 'User not found. They must register first.' });
    return;
  }
  const { data, error } = await supabase
    .from('organization_users')
    .upsert({ organization_id: organizationId, user_id: user.id, role }, { onConflict: 'organization_id,user_id' })
    .select().single();
  if (error) throw error;
  res.status(201).json({ success: true, data });
}
