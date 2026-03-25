-- =============================================
-- marketing-os-core :: Meta & Reporting Tables
-- =============================================

-- ---- META CONNECTIONS ----
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

-- ---- META DAILY SNAPSHOTS ----
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

-- ---- META CAMPAIGN DAILY ----
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

-- ---- META AI REPORTS ----
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

-- ---- ADD REPORT FIELDS TO BRANDING ----
ALTER TABLE branding_settings
  ADD COLUMN IF NOT EXISTS report_title TEXT,
  ADD COLUMN IF NOT EXISTS footer_text TEXT;

-- ---- INDEXES ----
CREATE INDEX IF NOT EXISTS idx_meta_connections_org ON meta_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_snapshots_org ON meta_daily_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_snapshots_date ON meta_daily_snapshots(connection_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_meta_campaign_daily_org ON meta_campaign_daily(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaign_daily_date ON meta_campaign_daily(connection_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_meta_reports_org ON meta_ai_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_reports_date ON meta_ai_reports(organization_id, period_start, period_end);

-- ---- UPDATED_AT TRIGGERS ----
CREATE TRIGGER trg_meta_connections_updated_at
  BEFORE UPDATE ON meta_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_meta_ai_reports_updated_at
  BEFORE UPDATE ON meta_ai_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---- ROW LEVEL SECURITY ----
ALTER TABLE meta_connections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_campaign_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ai_reports    ENABLE ROW LEVEL SECURITY;
