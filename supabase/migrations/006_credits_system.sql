-- ============================================================
-- 006: AI Credit Usage System
-- ============================================================

-- ── Organization usage tracking ─────────────────────────────
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

-- ── Credit transaction log ──────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  credits         INTEGER NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('purchase', 'reset', 'bonus', 'consume')),
  description     TEXT,
  stripe_session_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_org_usage_org_id ON organization_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_org_id ON credit_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_created ON credit_transactions(created_at);

-- ── Row-Level Security ──────────────────────────────────────
ALTER TABLE organization_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Members can view their org's usage
CREATE POLICY org_usage_select ON organization_usage
  FOR SELECT USING (is_org_member(organization_id));

-- Members can view their org's transactions
CREATE POLICY credit_tx_select ON credit_transactions
  FOR SELECT USING (is_org_member(organization_id));

-- Only service role can insert/update (server-side only)
-- No INSERT/UPDATE/DELETE policies for authenticated users

-- ── Default credit limits per plan ──────────────────────────
-- free: 100, starter: 500, pro: 2000, enterprise: 10000
-- These are enforced in application code, not DB constraints.

-- ── Auto-provision usage row for existing orgs ──────────────
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
