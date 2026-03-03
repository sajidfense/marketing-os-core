-- =============================================
-- marketing-os-core :: Database Schema
-- Multi-tenant, white-label AI Marketing SaaS
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---- ORGANIZATIONS ----
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','starter','pro','enterprise')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- USERS ----
-- Mirrors Supabase Auth users; extended profile
CREATE TABLE users (
  id              UUID PRIMARY KEY, -- matches auth.users.id
  email           TEXT UNIQUE NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- ORGANIZATION_USERS (junction) ----
CREATE TABLE organization_users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  invited_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at     TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

-- ---- CLIENTS ----
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT,
  company         TEXT,
  industry        TEXT,
  website         TEXT,
  notes           TEXT,
  metadata        JSONB DEFAULT '{}',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- BOOKINGS ----
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  scheduled_at    TIMESTAMPTZ,
  notes           TEXT,
  metadata        JSONB DEFAULT '{}',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- CAMPAIGNS ----
CREATE TABLE campaigns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed','archived')),
  goal            TEXT,
  target_audience TEXT,
  budget          NUMERIC(12,2),
  start_date      DATE,
  end_date        DATE,
  metadata        JSONB DEFAULT '{}',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- WORKFLOWS ----
CREATE TABLE workflows (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id     UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed')),
  steps           JSONB NOT NULL DEFAULT '[]',
  metadata        JSONB DEFAULT '{}',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- AI GENERATIONS ----
CREATE TABLE ai_generations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  skill_type      TEXT NOT NULL,
  input_data      JSONB NOT NULL,
  output_data     JSONB NOT NULL,
  model           TEXT NOT NULL,
  prompt_tokens   INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens    INTEGER NOT NULL DEFAULT 0,
  cost_estimate   NUMERIC(10,6) NOT NULL DEFAULT 0,
  campaign_id     UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- AI USAGE (aggregated tracking) ----
CREATE TABLE ai_usage (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  skill_type      TEXT NOT NULL,
  tokens_used     INTEGER NOT NULL DEFAULT 0,
  cost_estimate   NUMERIC(10,6) NOT NULL DEFAULT 0,
  period_day      DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- SUBSCRIPTIONS ----
CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id  TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan                TEXT NOT NULL DEFAULT 'free',
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','cancelled','trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- BRANDING SETTINGS ----
CREATE TABLE branding_settings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id   UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  logo_url          TEXT,
  favicon_url       TEXT,
  primary_color     TEXT DEFAULT '#6366f1',
  accent_color      TEXT DEFAULT '#a855f7',
  custom_domain     TEXT UNIQUE,
  app_name          TEXT,
  email_from_name   TEXT,
  email_from_address TEXT,
  support_email     TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- INDEXES ----
CREATE INDEX idx_organization_users_org  ON organization_users(organization_id);
CREATE INDEX idx_organization_users_user ON organization_users(user_id);
CREATE INDEX idx_clients_org             ON clients(organization_id);
CREATE INDEX idx_bookings_org            ON bookings(organization_id);
CREATE INDEX idx_bookings_client         ON bookings(client_id);
CREATE INDEX idx_campaigns_org           ON campaigns(organization_id);
CREATE INDEX idx_workflows_org           ON workflows(organization_id);
CREATE INDEX idx_ai_generations_org      ON ai_generations(organization_id);
CREATE INDEX idx_ai_generations_user     ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_skill    ON ai_generations(skill_type);
CREATE INDEX idx_ai_usage_org_day        ON ai_usage(organization_id, period_day);
CREATE INDEX idx_ai_usage_user_day       ON ai_usage(user_id, period_day);
CREATE INDEX idx_subscriptions_stripe    ON subscriptions(stripe_customer_id);

-- ---- UPDATED_AT TRIGGER ----
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organizations','users','clients','bookings',
    'campaigns','workflows','subscriptions','branding_settings'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END $$;

-- ---- ROW LEVEL SECURITY ----
ALTER TABLE organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage            ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_settings   ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — application uses service role key
