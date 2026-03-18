# Marketing OS

Production-grade, multi-tenant, white-label AI Marketing SaaS platform.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (JWT) |
| AI Engine | Anthropic Claude API |
| Billing | Stripe |

## Architecture

```
marketingos/
├── src/                          # Frontend (React + Vite)
│   ├── app/                      # App entry + routing
│   ├── components/               # UI components + layouts
│   ├── contexts/                 # Auth + Org React contexts
│   ├── hooks/                    # Custom hooks
│   ├── lib/                      # Supabase client, utils
│   ├── pages/                    # Route pages
│   ├── services/                 # API client
│   ├── styles/                   # Global CSS + Tailwind
│   └── types/                    # TypeScript types
├── server/                       # Backend (Express)
│   └── src/
│       ├── ai/prompts/           # AI prompt templates
│       ├── config/               # Environment validation
│       ├── controllers/          # Request handlers
│       ├── lib/                  # Supabase + Stripe clients
│       ├── middleware/           # Auth, org, rate limit, error
│       ├── routes/               # Express routers
│       ├── services/             # Business logic
│       ├── types/                # TypeScript types
│       ├── app.ts                # Express app setup
│       └── server.ts             # Server entry point
├── supabase/
│   └── migrations/               # SQL migration files
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Multi-Tenancy

Every business table includes `organization_id`. All API queries are scoped through `organizationMiddleware`, which:

1. Reads `x-organization-id` from the request header
2. Verifies the authenticated user belongs to that organization
3. Attaches `req.organizationId` and `req.userRole` to the request

## Auth Flow

```
Frontend → Supabase Auth → JWT access token
         → Bearer <jwt> + x-organization-id header → Backend
                    ↓
authMiddleware       → verifies JWT using SUPABASE_JWT_SECRET (no network call)
organizationMiddleware → verifies membership, sets req.organizationId + req.userRole
```

## API Routes

| Route | Description |
|-------|------------|
| `GET /health` | Health check |
| `GET /api/health` | API health check |
| **Campaigns** | |
| `GET /api/campaigns` | List campaigns |
| `POST /api/campaigns` | Create campaign |
| `GET /api/campaigns/:id` | Get campaign |
| `PATCH /api/campaigns/:id` | Update campaign |
| `DELETE /api/campaigns/:id` | Delete campaign |
| **Bookings** | |
| `GET /api/bookings` | List bookings |
| `POST /api/bookings` | Create booking |
| `GET /api/bookings/:id` | Get booking |
| `PATCH /api/bookings/:id` | Update booking |
| `DELETE /api/bookings/:id` | Delete booking |
| **Workflows** | |
| `GET /api/workflows` | List workflows |
| `POST /api/workflows` | Create workflow |
| `GET /api/workflows/:id` | Get workflow |
| `PATCH /api/workflows/:id` | Update workflow |
| `DELETE /api/workflows/:id` | Delete workflow |
| **AI Skills** | |
| `POST /api/skills/:skillType` | Generate AI content |
| `GET /api/skills/history` | Generation history |
| **Organizations** | |
| `GET /api/organizations/settings` | Org settings + branding |
| `PATCH /api/organizations/branding` | Update branding |
| `GET /api/organizations/usage` | Usage stats |
| `POST /api/organizations/members/invite` | Invite member |
| **Branding** | |
| `GET /api/branding` | Get org branding |
| `PUT /api/branding` | Update org branding |
| **Billing** | |
| `POST /api/billing/create-checkout-session` | Stripe checkout |
| `POST /api/billing/webhook/stripe` | Stripe webhook |
| **Meta** | |
| `GET /api/meta/oauth/start` | Start Meta OAuth |
| `GET /api/meta/oauth/callback` | Meta OAuth callback |
| `GET /api/meta/connections` | List connections |
| `GET /api/meta/overview` | Meta data overview |
| **Reports** | |
| `POST /api/reports/generate-board-report` | Generate board report |
| `POST /api/reports/export-pdf` | Export PDF |
| `GET /api/reports` | List reports |

## Local Development

### Prerequisites

- Node.js 20+
- npm 9+
- Supabase project (with Auth enabled)
- Stripe account (for billing features)
- Anthropic API key (for AI features)

### Setup

```bash
# 1. Clone and install
git clone <repo-url> marketingos
cd marketingos
npm run install:all

# 2. Configure environment
cp .env.example .env
# Fill in all required values in .env

# 3. Run database migrations
# Option A: Using Supabase CLI
supabase db push

# Option B: Using psql
npm run db:migrate

# 4. Start development (frontend + backend)
npm run dev:all

# Or start separately:
npm run dev          # Frontend on :5173
npm run dev:server   # Backend on :4000
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL (default: `/api`) |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `PORT` | No | Backend port (default: 4000) |
| `NODE_ENV` | No | Environment (default: development) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `SUPABASE_JWT_SECRET` | Yes | Supabase JWT secret |
| `ANTHROPIC_API_KEY` | Yes | Anthropic Claude API key |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `ALLOWED_ORIGINS` | No | CORS origins (comma-separated) |
| `DAILY_USER_GENERATION_CAP` | No | Per-user daily AI limit (default: 50) |
| `MONTHLY_ORG_TOKEN_CAP` | No | Per-org monthly token cap (default: 5M) |

## Database

### Running Migrations

Migrations are in `supabase/migrations/`:
- `001_initial_schema.sql` — Core tables (organizations, users, campaigns, bookings, workflows, etc.)
- `002_meta_reporting_tables.sql` — Meta connections, snapshots, reports

```bash
# Using psql
psql $DATABASE_URL -f supabase/migrations/001_initial_schema.sql
psql $DATABASE_URL -f supabase/migrations/002_meta_reporting_tables.sql
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Tenant organizations |
| `users` | User profiles (mirrors auth.users) |
| `organization_users` | Org membership + roles |
| `campaigns` | Marketing campaigns |
| `bookings` | Client bookings |
| `workflows` | Automation workflows |
| `ai_generations` | AI generation history |
| `ai_usage` | Usage tracking per day |
| `subscriptions` | Stripe subscription state |
| `branding_settings` | White-label branding |
| `meta_connections` | Meta/Facebook API connections |
| `meta_daily_snapshots` | Daily ad performance data |
| `meta_ai_reports` | AI-generated board reports |

## Building for Production

```bash
# Build frontend
npm run build

# Build backend
npm run build:server

# Start production server
npm run start:server
```

## Docker

```bash
# Build and run
docker compose up --build

# Or build image directly
docker build -t marketing-os .
docker run -p 4000:4000 --env-file .env marketing-os
```

## Deployment

### Railway

The project includes `railway.json` and `nixpacks.toml` for Railway deployment. Set all required environment variables in your Railway service configuration.

### Vercel (Frontend Only)

Deploy the frontend to Vercel by setting the build command to `npm run build` and the output directory to `dist/client`. Set `VITE_API_URL` to your backend URL.

### Render

Use the Dockerfile or set:
- Build command: `npm run install:all && npm run build && npm run build:server`
- Start command: `node server/dist/server.js`

## Adding New AI Skills

1. Create prompt template in `server/src/ai/prompts/mySkill.ts`
2. Export `mySkillSystem` and `mySkillUser(input)` functions
3. Add case to `resolvePrompt()` in `marketingSkills.service.ts`
4. Add skill type to `VALID_SKILLS` array in `skills.controller.ts`

## Troubleshooting

| Issue | Solution |
|-------|---------|
| `Missing SUPABASE_URL` on startup | Ensure `.env` file exists with all required vars |
| `Token has expired` 401 errors | Supabase session expired; re-login on frontend |
| Rate limit errors (429) | Check `DAILY_USER_GENERATION_CAP` / `MONTHLY_ORG_TOKEN_CAP` |
| CORS errors | Set `ALLOWED_ORIGINS` to include your frontend URL |
| Stripe webhook fails | Ensure `STRIPE_WEBHOOK_SECRET` matches your Stripe dashboard |
| Frontend shows blank page | Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set |
