-- =============================================
-- 005: Google Ads + SEMrush Integration Tables
-- =============================================

-- ---- GOOGLE ADS INTEGRATIONS ----
CREATE TABLE google_integrations (
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

-- ---- SEMRUSH SNAPSHOTS (cache) ----
CREATE TABLE semrush_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  query_type      TEXT NOT NULL,          -- 'keywords', 'domain-overview'
  query_input     TEXT NOT NULL,          -- domain or keyword searched
  data            JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- INDEXES ----
CREATE INDEX idx_google_integrations_org ON google_integrations(organization_id);
CREATE INDEX idx_semrush_snapshots_org   ON semrush_snapshots(organization_id);
CREATE INDEX idx_semrush_snapshots_query ON semrush_snapshots(organization_id, query_type, query_input);

-- ---- RLS ----
ALTER TABLE google_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE semrush_snapshots   ENABLE ROW LEVEL SECURITY;

-- ---- UPDATED_AT TRIGGER ----
CREATE TRIGGER trg_google_integrations_updated_at
  BEFORE UPDATE ON google_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
