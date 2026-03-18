import { z } from 'zod';

const envSchema = z.object({
  // ── Server ─────────────────────────────────────────────────────
  PORT: z
    .string()
    .default('4000')
    .transform(Number)
    .pipe(z.number().int().positive()),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // ── Supabase ───────────────────────────────────────────────────
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_JWT_SECRET: z.string().min(1, 'SUPABASE_JWT_SECRET is required'),

  // ── AI ─────────────────────────────────────────────────────────
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),

  // ── Stripe ─────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),

  // ── CORS ───────────────────────────────────────────────────────
  // No wildcard default — must be explicitly set to prevent open CORS
  ALLOWED_ORIGINS: z.string().min(1, 'ALLOWED_ORIGINS is required (comma-separated list of origins)'),

  // ── PageSpeed (optional) ───────────────────────────────────────
  PAGESPEED_API_KEY: z.string().optional(),

  // ── Meta (optional) ────────────────────────────────────────────
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_REDIRECT_URI: z.string().url().optional(),

  // ── Admin bypass (optional) ────────────────────────────────────
  ADMIN_SECRET: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),

  // ── Google Ads (optional) ─────────────────────────────────────
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  // ── SEMrush (optional) ──────────────────────────────────────
  SEMRUSH_API_KEY: z.string().optional(),

  // ── Frontend URL (for OAuth redirects) ──────────────────────
  FRONTEND_URL: z.string().url().optional(),

  // ── Rate-limiting / caps (optional) ────────────────────────────
  DAILY_USER_GENERATION_CAP: z
    .string()
    .default('50')
    .transform(Number)
    .pipe(z.number().int().nonnegative()),
  MONTHLY_ORG_TOKEN_CAP: z
    .string()
    .default('5000000')
    .transform(Number)
    .pipe(z.number().int().nonnegative()),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error(
      `\n❌  Environment validation failed:\n${formatted}\n\nPlease check your .env file or environment variables.\n`,
    );

    process.exit(1);
  }

  const data = result.data;

  // Production safety checks
  if (data.NODE_ENV === 'production') {
    if (data.ALLOWED_ORIGINS === '*') {
      console.error('❌  ALLOWED_ORIGINS must not be "*" in production');
      process.exit(1);
    }
    if (data.ADMIN_SECRET || data.ADMIN_PASSWORD) {
      console.warn('⚠️  Admin bypass is enabled in production — disable when not needed');
    }
    if (data.STRIPE_SECRET_KEY.startsWith('pk_')) {
      console.error('❌  STRIPE_SECRET_KEY appears to be a publishable key, not a secret key');
      process.exit(1);
    }
  }

  return data;
}

export type Env = z.infer<typeof envSchema>;

export const env = validateEnv();
