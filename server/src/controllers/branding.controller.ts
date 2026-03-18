import { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

// ── Validation ──────────────────────────────────────────────────
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
  report_title:       z.string().optional(),
  footer_text:        z.string().optional(),
});

export type BrandingInput = z.infer<typeof brandingSchema>;

// ── Interfaces ──────────────────────────────────────────────────
export interface BrandingSettings extends BrandingInput {
  id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

// ── GET branding ────────────────────────────────────────────────
export async function getBranding(req: Request, res: Response): Promise<void> {
  const { organizationId } = req;

  const { data, error } = await supabase
    .from('branding_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found (acceptable — org may not have branding yet)
    res.status(500).json({ success: false, error: 'Failed to fetch branding settings' });
    return;
  }

  res.json({ success: true, data: data ?? null });
}

// ── PUT branding (admin/owner only) ─────────────────────────────
export async function updateBranding(req: Request, res: Response): Promise<void> {
  const { organizationId, userRole } = req;

  if (!['owner', 'admin'].includes(userRole)) {
    res.status(403).json({ success: false, error: 'Only owners and admins can update branding' });
    return;
  }

  const parsed = brandingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { data, error } = await supabase
    .from('branding_settings')
    .upsert(
      { ...parsed.data, organization_id: organizationId },
      { onConflict: 'organization_id' },
    )
    .select()
    .single();

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to update branding settings' });
    return;
  }

  res.json({ success: true, data });
}
