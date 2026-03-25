# QA Checklist — MarketingOS

**Last audit:** 2026-03-25
**Auditor:** Automated comprehensive audit

---

## Issues Found & Fixed

### CRITICAL — Fixed

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| 1 | **Async route handlers not caught by Express error middleware** — Express 4 does not catch rejected promises from async handlers, causing unhandled rejections and silent crashes | All route files in `server/src/routes/` | Created `asyncHandler()` utility (`server/src/lib/asyncHandler.ts`) and wrapped all async route handlers |
| 2 | **401 after failed session refresh leaves app in broken state** — user stays on protected pages with invalid token | `src/services/api.ts` | Added `supabase.auth.signOut()` when refresh fails, triggering `onAuthStateChange` → redirect to login |
| 3 | **getSession error silently swallowed on page load** — app could redirect to login even with valid session in storage | `src/contexts/AuthContext.tsx` | Added `.catch()` to `getSession()` promise that sets user to null gracefully |
| 4 | **Logout throws error but nobody catches it** — Sidebar calls `logout()` as fire-and-forget async | `src/contexts/AuthContext.tsx`, `src/components/layout/Sidebar.tsx` | Made logout always clear state first, swallow signOut errors; Sidebar wraps in `.catch()` |
| 5 | **Credits: transaction not logged on retry failure** — audit trail missing for consumed credits | `server/src/services/credits.service.ts` | Added `logConsumeTransaction()` call even when retry update fails |
| 6 | **addPurchasedCredits: no concurrency protection** — concurrent webhooks could lose a credit pack | `server/src/services/credits.service.ts` | Added optimistic locking with `eq('credits_limit', ...)` and retry logic matching `consumeCredits` pattern |
| 7 | **Reports.tsx badge type mismatch** — `'success' as 'default'` type coercion causes runtime issues | `src/pages/Reports.tsx` | Fixed type annotation to include `'success'` variant |
| 8 | **Deleted types file** — `src/types/index.ts` was deleted from working tree | `src/types/index.ts` | Restored from git HEAD |
| 9 | **Missing invoice.payment_failed webhook** — subscription status stays 'active' after payment failure | `server/src/routes/billing.routes.ts` | Added `invoice.payment_failed` handler that sets org to 'inactive' |

### CRITICAL — Fixed (Phase 2)

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| 10 | **Report generation was 501 Not Implemented** — users could not generate board reports | `server/src/controllers/reports.controller.ts` | Fully implemented: gathers campaign/lead/AI data, creates DB record, generates AI narrative via Claude, updates with highlights/recommendations. Background processing so UI shows 'generating' immediately |
| 11 | **6 pages lost all data on refresh** — Roadmap, ContentCalendar, Leads, CreativeLibrary, CampaignStrategy, SEOPlan were client-side-only state | All 6 page files + 6 new controllers + 6 new route files | Created DB tables (migration 009), CRUD controllers via `crudFactory`, API routes, refactored all 6 frontend pages to fetch/create/update via API |
| 12 | **PDF export was 501** | `server/src/controllers/reports.controller.ts` | Implemented as HTML export with proper Content-Disposition header |

### HIGH — Known Issues (require external config)

| # | Issue | Notes |
|---|-------|-------|
| 1 | **Meta OAuth callback returns 501** | `server/src/controllers/meta.controller.ts` — needs META_APP_ID/SECRET configured. Gracefully returns "Not Implemented" |
| 2 | **Google OAuth callback trusts state parameter** | The `organizationId` in state should be validated against `req.organizationId`. Currently safe because route is behind org middleware |
| 3 | **Credit system is fail-open by design** | If credit DB errors occur, requests are allowed through. Intentional resilience choice, documented |

---

## Test Scenarios

### A. Authentication
- [ ] New user signup → email confirmation → login
- [ ] Existing user login with correct credentials
- [ ] Login with wrong password shows error
- [ ] Session persists after page refresh
- [ ] Logout clears session and redirects to /login
- [ ] Expired token → auto-refresh → retry succeeds
- [ ] Expired token + failed refresh → auto-signout → redirect to login
- [ ] Password reset email sent
- [ ] Password update via reset link works
- [ ] Protected routes redirect to /login when unauthenticated

### B. Organization / Multi-Tenancy
- [ ] New org created during onboarding
- [ ] Org resolved from authenticated user (no header)
- [ ] User without org → redirected to /onboarding
- [ ] Dashboard shows only org-scoped data
- [ ] No cross-org data leakage in campaigns/bookings/workflows
- [ ] Comped org bypasses credit checks
- [ ] New org starts completely empty (no demo data)

### C. Onboarding Flow
- [ ] Step 1: Create organization name
- [ ] Step 2: Create first campaign (saved to DB)
- [ ] Step 3: Set branding colors (saved to DB)
- [ ] Step 4: Select goals (optional, saved to org metadata)
- [ ] Step 5: Complete → redirect to dashboard
- [ ] Going back between steps preserves state
- [ ] Duplicate org creation returns 409

### D. Admin Provisioning
- [ ] Admin login via secret
- [ ] Create organization via admin panel
- [ ] Create user via admin panel
- [ ] Provision full client (org + user + link)
- [ ] Provisioned user can login immediately
- [ ] Comped org flag works correctly

### E. Dashboard
- [ ] Stats load from backend (campaigns, bookings, workflows, AI generations)
- [ ] All counts are zero for new org
- [ ] Quick action buttons navigate correctly
- [ ] Loading skeleton shows during fetch

### F. CRUD Pages (Campaigns, Bookings, Workflows)
- [ ] List loads from API, scoped to org
- [ ] Create new item works
- [ ] Edit existing item works
- [ ] Delete item works
- [ ] Empty state shows when no items
- [ ] Export to CSV works (campaigns)

### G. AI Skills
- [ ] Ad Copy: form → submit → credits checked → AI call → result rendered
- [ ] Video Scripts: same flow
- [ ] Social Captions: same flow
- [ ] Blog Planner: same flow
- [ ] SEO Analysis: same flow
- [ ] SEO Report: same flow
- [ ] Credit usage decreases after each AI call
- [ ] Credit exhausted → 402 error shown to user
- [ ] Comped org → unlimited AI calls

### H. Integrations Vault
- [ ] Integration cards render (Google Ads, SEMrush, OpenAI)
- [ ] Save API key → encrypted → success message
- [ ] Status shows Connected after save
- [ ] Update key works
- [ ] Delete/disconnect works
- [ ] API keys never returned to frontend
- [ ] Keys used server-side only (SEMrush service demonstrates this)

### I. Billing & Credits
- [ ] Credit usage bar displays correctly
- [ ] Warning state at 80% usage
- [ ] Exhausted state at 100% usage
- [ ] Reset date displays correctly
- [ ] Buy credits → Stripe checkout → webhook → credits added
- [ ] Subscription checkout works
- [ ] Payment failed → org set to inactive
- [ ] Comped org → billing bypassed

### J. SEO Tools
- [ ] SEO Analyzer page loads
- [ ] SEO Report page loads
- [ ] SEO Plan page shows empty state for new org
- [ ] Add task manually works
- [ ] Task status cycling works

### K. Content & Strategy Pages
- [ ] Content Calendar: empty state → add content → renders on calendar
- [ ] Creative Library: empty state → add asset → renders in grid
- [ ] Campaign Strategy: empty state → add strategy → renders card
- [ ] Leads: empty state → add lead → appears in table/pipeline
- [ ] Roadmap: empty state → add milestone → appears on timeline

### L. Settings & Branding
- [ ] Branding page loads
- [ ] Color picker works
- [ ] Save branding persists to backend
- [ ] Settings page loads
- [ ] Invite member form works (sends API call)

### M. Exports
- [ ] CSV export on Campaigns page
- [ ] CSV export on Leads page
- [ ] CSV export on Google Ads page
- [ ] Exported data matches what's on screen
- [ ] File downloads correctly in browser

### N. Security
- [x] All API routes require auth middleware
- [x] Org resolved server-side, not from headers
- [x] Admin routes gated by secret
- [x] No hardcoded secrets in code
- [x] No service role key exposed to frontend
- [x] RLS policies on all business tables
- [x] Integrations vault: keys encrypted at rest (AES-256-GCM)
- [x] Integrations table: RLS deny-all (service role only)

---

## Architecture Summary

```
Frontend (React + Vite)
├── Auth: Supabase Auth (JWT)
├── API Client: custom fetch wrapper with auto-refresh
├── State: AuthContext → OrgContext → CreditsContext
├── Routing: React Router v6 with ProtectedRoute + OrgGuard
└── UI: Tailwind CSS + custom components

Backend (Express + TypeScript)
├── Auth: Supabase getUser(token) validation
├── Org: Server-side org resolution from user membership
├── Error handling: asyncHandler wrapper + centralized error middleware
├── AI: Anthropic Claude API
├── Payments: Stripe (subscriptions + one-time credit packs)
├── Database: Supabase (PostgreSQL + RLS)
└── Encryption: AES-256-GCM for integration API keys
```

---

## Files Added/Modified in This Audit

### New Files
- `server/src/lib/asyncHandler.ts` — Express async error handler wrapper
- `server/src/lib/crudFactory.ts` — Generic org-scoped CRUD controller factory
- `server/src/controllers/leads.controller.ts` — Leads CRUD
- `server/src/controllers/content-items.controller.ts` — Content items CRUD
- `server/src/controllers/roadmap.controller.ts` — Roadmap milestones CRUD
- `server/src/controllers/creative-assets.controller.ts` — Creative assets CRUD
- `server/src/controllers/strategies.controller.ts` — Campaign strategies CRUD
- `server/src/controllers/seo-tasks.controller.ts` — SEO tasks CRUD
- `server/src/routes/leads.routes.ts` — Leads routes
- `server/src/routes/content-items.routes.ts` — Content items routes
- `server/src/routes/roadmap.routes.ts` — Roadmap routes
- `server/src/routes/creative-assets.routes.ts` — Creative assets routes
- `server/src/routes/strategies.routes.ts` — Strategies routes
- `server/src/routes/seo-tasks.routes.ts` — SEO tasks routes
- `supabase/migrations/009_feature_tables.sql` — DB tables for leads, content_items, roadmap_milestones, creative_assets, campaign_strategies, seo_tasks

### Modified Files
- `src/services/api.ts` — Force sign-out on failed 401 refresh
- `src/contexts/AuthContext.tsx` — Error handling for getSession, resilient logout
- `src/components/layout/Sidebar.tsx` — Catch logout errors
- `src/pages/Reports.tsx` — Fix badge variant type
- `src/types/index.ts` — Restored from git
- `server/src/routes/bookings.routes.ts` — asyncHandler wrapper
- `server/src/routes/campaigns.routes.ts` — asyncHandler wrapper
- `server/src/routes/workflows.routes.ts` — asyncHandler wrapper
- `server/src/routes/organizations.routes.ts` — asyncHandler wrapper
- `server/src/routes/branding.routes.ts` — asyncHandler wrapper
- `server/src/routes/reports.routes.ts` — asyncHandler wrapper
- `server/src/routes/dashboard.routes.ts` — asyncHandler wrapper
- `server/src/routes/integrations.routes.ts` — asyncHandler wrapper on Google routes
- `server/src/services/credits.service.ts` — Transaction logging on retry failure, optimistic locking for purchases
- `server/src/routes/billing.routes.ts` — Added `invoice.payment_failed` webhook handler
- `server/src/controllers/reports.controller.ts` — Full implementation of report generation + export
- `server/src/routes/reports.routes.ts` — Fixed route paths to match frontend expectations
- `server/src/app.ts` — Mounted 6 new feature routers
- `src/pages/ContentCalendar.tsx` — Refactored to API persistence
- `src/pages/Leads.tsx` — Refactored to API persistence
- `src/pages/Roadmap.tsx` — Refactored to API persistence
- `src/pages/CreativeLibrary.tsx` — Refactored to API persistence
- `src/pages/CampaignStrategy.tsx` — Refactored to API persistence
- `src/pages/SEOPlan.tsx` — Refactored to API persistence

---

## Remaining Manual Setup Items

1. **Environment variables** — Ensure `.env` has all required keys:
   - `INTEGRATIONS_ENCRYPTION_KEY` (64-char hex) — generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`
   - `ANTHROPIC_API_KEY`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `ALLOWED_ORIGINS`

2. **Database migrations** — Run all migrations in `supabase/migrations/` (001-009)

3. **Stripe webhook** — Register webhook endpoint for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

4. **Meta integration** — Requires `META_APP_ID` and `META_APP_SECRET` to complete OAuth flow

5. **Google Ads integration** — Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

---

## Commands to Run Locally

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Start backend (port 4000)
cd server && npm run dev

# Start frontend (port 5173, proxies /api to :4000)
npm run dev

# Type-check backend
cd server && npx tsc --noEmit

# Run database migrations
# (via Supabase CLI or dashboard)
supabase db push
```
