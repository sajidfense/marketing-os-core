import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

// ── Validation schemas ────────────────────────────────────────────

const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  plan: z.enum(['free', 'pro', 'enterprise']),
  comped: z.boolean().default(false),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const assignUserSchema = z.object({
  user_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  role: z.enum(['owner', 'member']),
});

const provisionClientSchema = z.object({
  organization_name: z.string().min(2).max(100),
  admin_email: z.string().email(),
  password: z.string().min(8),
  plan: z.enum(['free', 'pro', 'enterprise']),
  comped: z.boolean().default(false),
});

// ── Helpers ───────────────────────────────────────────────────────

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = Math.random().toString(16).slice(2, 6);
  return `${base}-${suffix}`;
}

// ── 1. Create Organization ────────────────────────────────────────

export async function adminCreateOrganization(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const { name, plan, comped } = parsed.data;
    const slug = slugify(name);
    const subscriptionStatus = comped ? 'active' : 'inactive';

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        plan,
        is_active: true,
        subscription_status: subscriptionStatus,
        comped,
      })
      .select()
      .single();

    if (orgError) {
      // Slug collision — retry once
      const retrySlug = slugify(name);
      const { data: retryOrg, error: retryError } = await supabase
        .from('organizations')
        .insert({
          name,
          slug: retrySlug,
          plan,
          is_active: true,
          subscription_status: subscriptionStatus,
          comped,
        })
        .select()
        .single();

      if (retryError) {
        return res.status(500).json({ error: 'Failed to create organization' });
      }

      // Create default records for the org
      await createOrgDefaults(retryOrg.id, plan, comped);

      return res.status(201).json({ success: true, data: { organization: retryOrg } });
    }

    await createOrgDefaults(org.id, plan, comped);

    return res.status(201).json({ success: true, data: { organization: org } });
  } catch (err) {
    next(err);
  }
}

async function createOrgDefaults(orgId: string, plan: string, comped: boolean) {
  // Create default branding
  await supabase
    .from('branding_settings')
    .insert({ organization_id: orgId });

  // Create subscription record
  await supabase
    .from('subscriptions')
    .insert({
      organization_id: orgId,
      plan,
      status: comped ? 'active' : 'active', // subscription row status
    });
}

// ── 2. Create User ────────────────────────────────────────────────

export async function adminCreateUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const { email, password } = parsed.data;

    // Create user via Supabase Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // Upsert into users profile table
    await supabase.from('users').upsert(
      {
        id: userId,
        email,
        full_name: null,
        avatar_url: null,
      },
      { onConflict: 'id' },
    );

    return res.status(201).json({
      success: true,
      data: { user_id: userId, email },
    });
  } catch (err) {
    next(err);
  }
}

// ── 3. Assign User to Organization ────────────────────────────────

export async function adminAssignUserToOrg(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = assignUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const { user_id, organization_id, role } = parsed.data;

    // Verify org exists
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organization_id)
      .single();

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Verify user exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Insert membership (upsert to handle re-assignment)
    const { error: memberError } = await supabase
      .from('organization_users')
      .upsert(
        {
          organization_id,
          user_id,
          role,
          accepted_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,user_id' },
      );

    if (memberError) {
      return res.status(500).json({ error: 'Failed to assign user to organization' });
    }

    return res.status(201).json({
      success: true,
      data: { organization_id, user_id, role },
    });
  } catch (err) {
    next(err);
  }
}

// ── 4. Provision Client (Combined Flow) ───────────────────────────

export async function adminProvisionClient(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = provisionClientSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const { organization_name, admin_email, password, plan, comped } = parsed.data;
    const subscriptionStatus = comped ? 'active' : 'inactive';

    // ── Step 1: Create organization ──────────────────────────────
    const slug = slugify(organization_name);
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organization_name,
        slug,
        plan,
        is_active: true,
        subscription_status: subscriptionStatus,
        comped,
      })
      .select()
      .single();

    if (orgError) {
      return res.status(500).json({ error: `Failed to create organization: ${orgError.message}` });
    }

    // ── Step 2: Create user via Supabase Auth ────────────────────
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: admin_email,
      password,
      email_confirm: true,
    });

    if (authError) {
      // Rollback: delete the org we just created
      await supabase.from('organizations').delete().eq('id', org.id);
      return res.status(400).json({ error: `Failed to create user: ${authError.message}` });
    }

    const userId = authData.user.id;

    // Upsert user profile
    await supabase.from('users').upsert(
      {
        id: userId,
        email: admin_email,
        full_name: null,
        avatar_url: null,
      },
      { onConflict: 'id' },
    );

    // ── Step 3: Link user to org as owner ────────────────────────
    const { error: memberError } = await supabase
      .from('organization_users')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
        accepted_at: new Date().toISOString(),
      });

    if (memberError) {
      return res.status(500).json({ error: 'Failed to link user to organization' });
    }

    // ── Step 4: Create defaults ──────────────────────────────────
    await supabase
      .from('branding_settings')
      .insert({ organization_id: org.id });

    await supabase
      .from('subscriptions')
      .insert({
        organization_id: org.id,
        plan,
        status: 'active',
      });

    return res.status(201).json({
      success: true,
      data: {
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          plan: org.plan,
          comped: org.comped,
          subscription_status: org.subscription_status,
        },
        user: {
          id: userId,
          email: admin_email,
        },
        message: `Client "${organization_name}" provisioned successfully. User can log in with ${admin_email}.`,
      },
    });
  } catch (err) {
    next(err);
  }
}
