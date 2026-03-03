# marketing-os-core

Production-grade, multi-tenant, white-label AI Marketing SaaS backend.

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (JWT) |
| AI Engine | Anthropic Claude API |
| Billing | Stripe |

---

## Architecture

```
src/
├── server.ts                     # App entry point
├── routes/
│   ├── skills.routes.ts          # POST /api/skills/:skillType
│   ├── bookings.routes.ts        # CRUD /api/bookings
│   ├── campaigns.routes.ts       # CRUD /api/campaigns
│   ├── workflows.routes.ts       # CRUD /api/workflows
│   ├── billing.routes.ts         # Stripe checkout + webhook
│   └── organizations.routes.ts   # Org settings, branding, usage
├── controllers/                  # Request/response handling only
├── services/
│   ├── ai.service.ts             # Claude API calls + token tracking
│   ├── marketingSkills.service.ts # Centralized skill engine
│   ├── usage.service.ts          # Usage logging & aggregation
│   ├── booking.service.ts        # Complex booking logic
│   ├── campaign.service.ts       # Campaign aggregations
│   └── supabase.client.ts        # DB client singleton
├── ai/prompts/
│   ├── adCopy.ts
│   ├── landingPage.ts
│   ├── emailSequence.ts
│   ├── funnelStrategy.ts
│   └── campaignStrategy.ts
├── middleware/
│   ├── auth.middleware.ts         # JWT → userId + organizationId
│   ├── organization.middleware.ts # Org membership check
│   └── rateLimit.middleware.ts    # Global + per-user + per-org caps
└── database/
    └── schema.sql                 # Full Postgres schema with RLS
```

---

## Multi-Tenancy

Every business table includes `organization_id UUID NOT NULL`. All queries are scoped through the `organizationMiddleware`, which:

1. Reads `x-organization-id` request header
2. Verifies the authenticated user belongs to that org
3. Attaches `req.organizationId` and `req.userRole` to context

---

## Auth Flow

```
Client → Bearer <supabase_jwt> + x-organization-id header
         ↓
authMiddleware       → validates JWT via Supabase, sets req.userId
organizationMiddleware → verifies membership, sets req.organizationId + req.userRole
```

---

## AI Skill Engine

All AI generation flows through a single entry point:

```typescript
generateSkill(skillType, input, orgId, userId)
  1. Resolve prompt template (ai/prompts/)
  2. Call Claude via ai.service.ts
  3. Parse JSON output
  4. Store in ai_generations table
  5. Log to ai_usage table
  6. Return structured result
```

**Available skill types:**

| Endpoint | Skill |
|----------|-------|
| `POST /api/skills/ad-copy` | Ad copy variants for any platform |
| `POST /api/skills/landing-page` | Full landing page content structure |
| `POST /api/skills/email-sequence` | N-email nurture/conversion sequences |
| `POST /api/skills/funnel-strategy` | Complete AIDA funnel strategy |
| `POST /api/skills/campaign-strategy` | Multi-channel campaign plan |

---

## Rate Limiting

| Limit | Scope | Default |
|-------|-------|---------|
| `DAILY_USER_GENERATION_CAP` | Per user / day | 50 generations |
| `MONTHLY_ORG_TOKEN_CAP` | Per org / month | 5,000,000 tokens |
| Global limiter | All routes | 200 req/min |

Override defaults via environment variables.

---

## Billing

Stripe integration lives in `billing.routes.ts`:

- `POST /api/create-checkout-session` — creates a Stripe Checkout session
- `POST /api/webhook/stripe` — handles `checkout.session.completed`, `customer.subscription.updated/deleted`

Subscription state is stored in the `subscriptions` table and synced on every webhook event.

---

## White-Label Support

Each organization has a `branding_settings` row:

```json
{
  "logo_url": "https://cdn.example.com/logo.png",
  "primary_color": "#6366f1",
  "accent_color": "#a855f7",
  "custom_domain": "app.yourclient.com",
  "email_from_name": "YourBrand",
  "email_from_address": "hello@yourclient.com"
}
```

Fetch via `GET /api/organizations/settings`.

---

## Setup

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, STRIPE_SECRET_KEY

# 3. Run migrations
npm run db:migrate

# 4. Dev server
npm run dev

# 5. Production
npm run build && npm start
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (bypasses RLS) |
| `ANTHROPIC_API_KEY` | ✅ | Claude API key |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe webhook signing secret |
| `PORT` | ➖ | Server port (default: 3000) |
| `ALLOWED_ORIGINS` | ➖ | Comma-separated CORS origins |
| `DAILY_USER_GENERATION_CAP` | ➖ | Per-user daily cap (default: 50) |
| `MONTHLY_ORG_TOKEN_CAP` | ➖ | Per-org monthly token cap (default: 5M) |

---

## Adding New Skills

1. Create prompt template in `src/ai/prompts/mySkill.ts`
2. Export `mySkillSystem` and `mySkillUser(input)` functions
3. Add case to `resolvePrompt()` in `marketingSkills.service.ts`
4. Add skill type string to `VALID_SKILLS` array in `skills.controller.ts`

No route changes needed — the centralized handler picks it up automatically.
