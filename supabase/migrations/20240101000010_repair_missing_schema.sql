-- =============================================
-- 010: Repair — apply missing schema from migrations 002-006
-- Migrations 002-006 were stamped in history but never executed.
-- This migration is idempotent (IF NOT EXISTS / IF NOT EXISTS everywhere).
-- =============================================

-- ═══════════════════════════════════════════════
-- FROM MIGRATION 002: Meta & Reporting Tables
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS meta_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL DEFAULT 'facebook' CHECK (platform IN ('facebook','instagram')),
  account_id      TEXT NOT NULL,
  account_name    TEXT,
  access_token    TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  scopes          TEXT[],
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  metadata        JSONB DEFAULT '{}',
  connected_by    UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, account_id)
);

CREATE TABLE IF NOT EXISTS meta_daily_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id   UUID NOT NULL REFERENCES meta_connections(id) ON DELETE CASCADE,
  snapshot_date   DATE NOT NULL,
  impressions     INTEGER DEFAULT 0,
  reach           INTEGER DEFAULT 0,
  clicks          INTEGER DEFAULT 0,
  spend           NUMERIC(12,2) DEFAULT 0,
  conversions     INTEGER DEFAULT 0,
  ctr             NUMERIC(8,4) DEFAULT 0,
  cpc             NUMERIC(8,4) DEFAULT 0,
  cpm             NUMERIC(8,4) DEFAULT 0,
  roas            NUMERIC(8,4) DEFAULT 0,
  raw_data        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(connection_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS meta_campaign_daily (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id   UUID NOT NULL REFERENCES meta_connections(id) ON DELETE CASCADE,
  campaign_ext_id TEXT NOT NULL,
  campaign_name   TEXT,
  snapshot_date   DATE NOT NULL,
  impressions     INTEGER DEFAULT 0,
  reach           INTEGER DEFAULT 0,
  clicks          INTEGER DEFAULT 0,
  spend           NUMERIC(12,2) DEFAULT 0,
  conversions     INTEGER DEFAULT 0,
  ctr             NUMERIC(8,4) DEFAULT 0,
  cpc             NUMERIC(8,4) DEFAULT 0,
  raw_data        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(connection_id, campaign_ext_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS meta_ai_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_type     TEXT NOT NULL DEFAULT 'board_report' CHECK (report_type IN ('board_report','weekly_summary','monthly_review','custom')),
  title           TEXT NOT NULL,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  kpi_data        JSONB NOT NULL DEFAULT '{}',
  ai_narrative    TEXT,
  html_content    TEXT,
  branding_snapshot JSONB DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generating','completed','failed')),
  generated_by    UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Branding report fields
ALTER TABLE branding_settings ADD COLUMN IF NOT EXISTS report_title TEXT;
ALTER TABLE branding_settings ADD COLUMN IF NOT EXISTS footer_text TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meta_connections_org ON meta_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_snapshots_org ON meta_daily_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_snapshots_date ON meta_daily_snapshots(connection_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_meta_campaign_daily_org ON meta_campaign_daily(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaign_daily_date ON meta_campaign_daily(connection_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_meta_reports_org ON meta_ai_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_reports_date ON meta_ai_reports(organization_id, period_start, period_end);

-- Triggers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_meta_connections_updated_at') THEN
    CREATE TRIGGER trg_meta_connections_updated_at BEFORE UPDATE ON meta_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_meta_ai_reports_updated_at') THEN
    CREATE TRIGGER trg_meta_ai_reports_updated_at BEFORE UPDATE ON meta_ai_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS
ALTER TABLE meta_connections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_campaign_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ai_reports    ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════
-- FROM MIGRATION 004: Admin Provisioning Support
-- ═══════════════════════════════════════════════

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS comped BOOLEAN NOT NULL DEFAULT FALSE;

-- Add check constraint if not present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'organizations_subscription_status_check'
  ) THEN
    ALTER TABLE organizations ADD CONSTRAINT organizations_subscription_status_check
      CHECK (subscription_status IN ('active', 'inactive'));
  END IF;
END $$;

-- Set existing active orgs to 'active' status
UPDATE organizations SET subscription_status = 'active' WHERE is_active = TRUE AND subscription_status = 'inactive';

-- Extend organization_users role check to include super_admin
ALTER TABLE organization_users DROP CONSTRAINT IF EXISTS organization_users_role_check;
ALTER TABLE organization_users
  ADD CONSTRAINT organization_users_role_check
    CHECK (role IN ('owner', 'admin', 'member', 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_org_users_role ON organization_users(role);


-- ═══════════════════════════════════════════════
-- FROM MIGRATION 005: Google Ads + SEMrush
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS google_integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  access_token    TEXT NOT NULL,
  refresh_token   TEXT NOT NULL,
  customer_id     TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes          TEXT[] DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id)
);

CREATE TABLE IF NOT EXISTS semrush_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  query_type      TEXT NOT NULL,
  query_input     TEXT NOT NULL,
  data            JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_integrations_org ON google_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_semrush_snapshots_org   ON semrush_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_semrush_snapshots_query ON semrush_snapshots(organization_id, query_type, query_input);

ALTER TABLE google_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE semrush_snapshots   ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_google_integrations_updated_at') THEN
    CREATE TRIGGER trg_google_integrations_updated_at BEFORE UPDATE ON google_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;


-- ═══════════════════════════════════════════════
-- FROM MIGRATION 006: Credit System
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS organization_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  credits_used    INTEGER NOT NULL DEFAULT 0 CHECK (credits_used >= 0),
  credits_limit   INTEGER NOT NULL DEFAULT 100,
  reset_date      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id)
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  credits         INTEGER NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('purchase', 'reset', 'bonus', 'consume')),
  description     TEXT,
  stripe_session_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_usage_org_id ON organization_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_org_id ON credit_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_created ON credit_transactions(created_at);

ALTER TABLE organization_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Auto-provision usage for existing orgs
INSERT INTO organization_usage (organization_id, credits_used, credits_limit, reset_date)
SELECT id, 0,
  CASE plan
    WHEN 'free'       THEN 100
    WHEN 'starter'    THEN 500
    WHEN 'pro'        THEN 2000
    WHEN 'enterprise' THEN 10000
    ELSE 100
  END,
  NOW() + INTERVAL '30 days'
FROM organizations
WHERE id NOT IN (SELECT organization_id FROM organization_usage)
ON CONFLICT (organization_id) DO NOTHING;


-- ═══════════════════════════════════════════════
-- Sync comped flag from metadata to new column
-- ═══════════════════════════════════════════════

UPDATE organizations
SET comped = TRUE, subscription_status = 'active'
WHERE (metadata -> 'billing' ->> 'comped')::boolean = TRUE;


-- ═══════════════════════════════════════════════
-- Fix Finance One user: role should be owner
-- ═══════════════════════════════════════════════

UPDATE organization_users
SET role = 'owner', accepted_at = NOW()
WHERE organization_id = 'cd9d1a8a-8d73-43a1-8b29-fd368ada9c82'
  AND user_id = 'a489a74c-34c2-414e-9815-89e83ea9be49';


-- ═══════════════════════════════════════════════
-- Fix auth user: clean up ghost + ensure working login
-- ═══════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Update password for the existing auth user
UPDATE auth.users
SET encrypted_password = extensions.crypt('NewPassword123', extensions.gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
WHERE email = 'sajid.fense@financeone.com.au';

-- Ensure identity record exists
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT
  gen_random_uuid(), id,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true, 'phone_verified', false),
  'email', id::text, NOW(), NOW(), NOW()
FROM auth.users WHERE email = 'sajid.fense@financeone.com.au'
  AND id NOT IN (SELECT user_id FROM auth.identities WHERE provider = 'email')
ON CONFLICT DO NOTHING;
