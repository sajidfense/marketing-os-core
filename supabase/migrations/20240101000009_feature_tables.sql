-- =============================================
-- 009: Feature Tables — Leads, Content, Roadmap,
--      Creative Assets, Strategies, SEO Tasks
-- =============================================

-- ---- LEADS ----
CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT,
  company         TEXT,
  website         TEXT,
  stage           TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new','contacted','qualified','proposal','won','lost')),
  value           NUMERIC(12,2) DEFAULT 0,
  tags            TEXT[] DEFAULT '{}',
  last_activity   TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_org ON leads(organization_id);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---- CONTENT ITEMS (calendar) ----
CREATE TABLE content_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  content_type    TEXT NOT NULL DEFAULT 'blog' CHECK (content_type IN ('blog','social','video','email')),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published')),
  scheduled_day   INT,
  scheduled_month INT,
  scheduled_year  INT,
  body            TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_items_org ON content_items(organization_id);
CREATE INDEX idx_content_items_schedule ON content_items(organization_id, scheduled_year, scheduled_month);
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_content_items_updated_at BEFORE UPDATE ON content_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---- ROADMAP MILESTONES ----
CREATE TABLE roadmap_milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('completed','in-progress','planned','at-risk')),
  target_date     TEXT,
  linked_items    JSONB NOT NULL DEFAULT '[]',
  dependencies    TEXT[] DEFAULT '{}',
  sort_order      INT NOT NULL DEFAULT 0,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roadmap_milestones_org ON roadmap_milestones(organization_id);
ALTER TABLE roadmap_milestones ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_roadmap_milestones_updated_at BEFORE UPDATE ON roadmap_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---- CREATIVE ASSETS ----
CREATE TABLE creative_assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  asset_type      TEXT NOT NULL DEFAULT 'image' CHECK (asset_type IN ('image','video','document','audio')),
  tags            TEXT[] DEFAULT '{}',
  file_size       TEXT,
  file_url        TEXT,
  campaign        TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creative_assets_org ON creative_assets(organization_id);
ALTER TABLE creative_assets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_creative_assets_updated_at BEFORE UPDATE ON creative_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---- CAMPAIGN STRATEGIES ----
CREATE TABLE campaign_strategies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  objective       TEXT,
  status          TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('active','planning','completed','paused')),
  channels        TEXT[] DEFAULT '{}',
  budget          NUMERIC(12,2) DEFAULT 0,
  timeframe       TEXT,
  kpis            JSONB NOT NULL DEFAULT '[]',
  audiences       TEXT[] DEFAULT '{}',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaign_strategies_org ON campaign_strategies(organization_id);
ALTER TABLE campaign_strategies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_campaign_strategies_updated_at BEFORE UPDATE ON campaign_strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---- SEO TASKS ----
CREATE TABLE seo_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'technical' CHECK (category IN ('technical','on-page','content','off-page')),
  priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  status          TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('done','in-progress','todo')),
  impact          TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seo_tasks_org ON seo_tasks(organization_id);
ALTER TABLE seo_tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_seo_tasks_updated_at BEFORE UPDATE ON seo_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
