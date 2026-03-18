import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { env } from '../config/env';
import { supabase } from '../lib/supabase';

const loginSchema = z.object({
  secret: z.string().min(1),
});

// Anon client for password sign-in (service role key cannot issue user sessions)
const supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export async function adminMagicLogin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!env.ADMIN_SECRET || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
      return res.status(404).json({ error: 'Admin bypass not configured' });
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Constant-time comparison to avoid timing attacks
    if (!timingSafeEqual(parsed.data.secret, env.ADMIN_SECRET)) {
      return res.status(401).json({ error: 'Invalid admin secret' });
    }

    // Ensure admin user exists (create if not)
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const adminExists = existingUser?.users?.some(u => u.email === env.ADMIN_EMAIL);

    if (!adminExists) {
      const { error: createError } = await supabase.auth.admin.createUser({
        email: env.ADMIN_EMAIL!,
        password: env.ADMIN_PASSWORD!,
        email_confirm: true,
        user_metadata: { full_name: 'Admin', role: 'admin' },
      });
      if (createError) {
        console.error('Failed to create admin user:', createError.message);
        return res.status(500).json({ error: 'Failed to provision admin account' });
      }
    }

    // Sign in with anon client to get a proper user session
    const { data: sessionData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: env.ADMIN_EMAIL!,
      password: env.ADMIN_PASSWORD!,
    });

    if (signInError || !sessionData.session) {
      console.error('Admin sign-in failed:', signInError?.message);
      return res.status(500).json({ error: 'Admin sign-in failed' });
    }

    return res.json({
      success: true,
      data: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_in: sessionData.session.expires_in,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Simple constant-time string comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
