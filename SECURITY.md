# Security Guide — Marketing OS

## Architecture Overview

- **Frontend**: Vite + React, deployed as static files on Vercel
- **Backend**: Express.js serverless function (`api/index.ts`) on Vercel
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth (JWT), verified server-side with `SUPABASE_JWT_SECRET`
- **Payments**: Stripe (server-side only)
- **AI**: Anthropic Claude API (server-side only)

## Environment Variable Security

### Client-safe (VITE_ prefix — bundled into browser JS)
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API base URL (use `/api` for Vercel) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (public, RLS-protected) |

### Server-only (NEVER prefix with VITE_)
| Variable | Purpose |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Full admin access, bypasses RLS |
| `SUPABASE_JWT_SECRET` | Verifies user JWTs |
| `ANTHROPIC_API_KEY` | AI API access |
| `STRIPE_SECRET_KEY` | Stripe payments (must start with `sk_`) |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook signatures |
| `ADMIN_SECRET` | Admin bypass authentication |
| `ADMIN_PASSWORD` | Admin account password |
| `META_APP_SECRET` | Facebook/Instagram OAuth |

## Key Security Measures

### Authentication
- All API routes (except health, admin, and Stripe webhook) require valid JWT
- JWT verified with `HS256` using `SUPABASE_JWT_SECRET`
- Organization membership verified on every request via `organization_users` table

### Multi-tenant Isolation
- Every data query is scoped by `organization_id`
- Organization middleware verifies user is a member before granting access
- RLS policies provide defense-in-depth at the database level

### Input Validation
- All request bodies validated with Zod schemas
- URL inputs checked for SSRF (private IP/localhost blocked)
- Rate limiting: per-IP global + per-user daily AI cap + per-org monthly token cap

### CORS
- Explicit origin allowlist required (no wildcard in production)
- `credentials: true` for cookie/auth header support

### Error Handling
- Production errors return generic "Internal server error" message
- Stack traces only shown in development
- Stripe error details stripped in production

## Deployment Checklist (Vercel)

### Required Environment Variables
Set all of these in Vercel Dashboard > Settings > Environment Variables:

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY          # Must be sk_live_* or sk_test_*, NOT pk_*
STRIPE_WEBHOOK_SECRET
ALLOWED_ORIGINS            # e.g., https://your-domain.com
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_URL               # Set to /api for Vercel
NODE_ENV                   # Set to production
```

### Post-Deploy Verification
- [ ] Confirm `STRIPE_SECRET_KEY` starts with `sk_`, not `pk_`
- [ ] Confirm `ALLOWED_ORIGINS` is set to your production domain (not `*`)
- [ ] Confirm `NODE_ENV` is `production`
- [ ] Confirm admin bypass env vars (`ADMIN_SECRET`, `ADMIN_PASSWORD`) are removed or intentionally set
- [ ] Test auth flow: signup, login, logout
- [ ] Test org isolation: user A cannot see user B's data
- [ ] Confirm Stripe webhook endpoint is registered and signature verification works
- [ ] Run RLS policies migration (`003_rls_policies.sql`) in Supabase SQL Editor

## Supabase Setup

### RLS Policies
The migration `supabase/migrations/003_rls_policies.sql` defines row-level security policies for all tables. **You must run this migration** in the Supabase SQL Editor or via CLI:

```bash
supabase db push
```

This provides defense-in-depth: even if someone obtains the anon key, they can only access data within orgs they belong to.

### Important Notes
- The backend uses the **service role key** which bypasses RLS
- Application-layer org scoping (`organization_id` checks) is the primary isolation mechanism
- RLS policies are a secondary safety net for direct Supabase client access

## Rotating Secrets

If any secret is compromised, rotate immediately:

1. **Supabase keys**: Dashboard > Settings > API > Regenerate
2. **Stripe keys**: Dashboard > Developers > API keys > Roll key
3. **Anthropic key**: Console > API Keys > Create new, revoke old
4. **JWT secret**: Dashboard > Settings > API > JWT Settings (will invalidate all sessions)
5. **Admin secret**: Generate a new random string, update in Vercel env vars

After rotation, redeploy the Vercel project to pick up new values.
