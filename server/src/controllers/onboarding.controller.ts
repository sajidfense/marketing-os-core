import { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

const createOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
});

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = Math.random().toString(16).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function getOnboardingStatus(req: Request, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('organization_users')
    .select('organization_id, role, organizations(id, name, slug, plan)')
    .eq('user_id', req.userId);

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to check organization status' });
    return;
  }

  const organizations = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.organization_id,
    role: row.role,
    ...(row.organizations as Record<string, unknown>),
  }));

  res.json({
    success: true,
    data: {
      hasOrganizations: organizations.length > 0,
      organizations,
    },
  });
}

export async function createOrganization(req: Request, res: Response): Promise<void> {
  const parsed = createOrgSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { name } = parsed.data;

  // 1. Upsert user profile from Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(req.userId);
  if (authError || !authUser?.user) {
    res.status(500).json({ success: false, error: 'Failed to fetch user profile' });
    return;
  }

  await supabase.from('users').upsert(
    {
      id: req.userId,
      email: authUser.user.email!,
      full_name: authUser.user.user_metadata?.full_name ?? null,
      avatar_url: authUser.user.user_metadata?.avatar_url ?? null,
    },
    { onConflict: 'id' }
  );

  // 2. Check if user already has an org (prevent duplicates)
  const { data: existing } = await supabase
    .from('organization_users')
    .select('organization_id, organizations(id, name)')
    .eq('user_id', req.userId);

  if (existing && existing.length > 0) {
    res.status(409).json({
      success: false,
      error: 'You already have an organization',
      data: { organizations: existing.map((r: Record<string, unknown>) => r.organizations) },
    });
    return;
  }

  // 3. Create organization
  const slug = slugify(name);
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name, slug, plan: 'free', is_active: true, subscription_status: 'inactive', comped: false })
    .select()
    .single();

  if (orgError) {
    // Slug collision — retry once
    const retrySlug = slugify(name);
    const { data: retryOrg, error: retryError } = await supabase
      .from('organizations')
      .insert({ name, slug: retrySlug, plan: 'free', is_active: true })
      .select()
      .single();

    if (retryError) {
      res.status(500).json({ success: false, error: 'Failed to create organization' });
      return;
    }

    return await finishOnboarding(req, res, retryOrg);
  }

  await finishOnboarding(req, res, org);
}

async function finishOnboarding(
  req: Request,
  res: Response,
  org: Record<string, unknown>
): Promise<void> {
  const orgId = org.id as string;

  // 4. Link user as owner
  const { error: memberError } = await supabase
    .from('organization_users')
    .insert({
      organization_id: orgId,
      user_id: req.userId,
      role: 'owner',
      accepted_at: new Date().toISOString(),
    });

  if (memberError) {
    res.status(500).json({ success: false, error: 'Failed to link user to organization' });
    return;
  }

  // 5. Create default branding
  await supabase
    .from('branding_settings')
    .insert({ organization_id: orgId });

  // 6. Create default subscription
  await supabase
    .from('subscriptions')
    .insert({ organization_id: orgId, plan: 'free', status: 'active' });

  res.status(201).json({
    success: true,
    data: {
      organization: org,
      membership: { organization_id: orgId, user_id: req.userId, role: 'owner' },
    },
  });
}
