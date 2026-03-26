-- =============================================
-- 012: Performance & SEO Dashboard
-- Org-scoped analytics snapshots + competitor tracking
-- =============================================

-- ── Performance Snapshots ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS performance_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain            TEXT NOT NULL,
  snapshot_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  category          TEXT NOT NULL DEFAULT 'primary' CHECK (category IN ('primary', 'competitor')),
  -- Core Web Vitals
  performance_score INT CHECK (performance_score BETWEEN 0 AND 100),
  lcp_ms            INT,
  tbt_ms            INT,
  cls_score         NUMERIC(6,4),
  fcp_ms            INT,
  -- SEO Metrics
  organic_traffic   INT,
  keyword_count     INT,
  domain_authority  INT CHECK (domain_authority BETWEEN 0 AND 100),
  backlinks_total   INT,
  paid_traffic      INT,
  ai_visibility     INT,
  -- Computed / stored insights
  recommendations   JSONB NOT NULL DEFAULT '[]',
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, domain, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_perf_snapshots_org ON performance_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_perf_snapshots_date ON performance_snapshots(organization_id, snapshot_date);
ALTER TABLE performance_snapshots ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_perf_snapshots_updated_at BEFORE UPDATE ON performance_snapshots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Competitor Domains ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competitor_domains (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain            TEXT NOT NULL,
  label             TEXT,
  is_primary        BOOLEAN NOT NULL DEFAULT FALSE,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_competitor_domains_org ON competitor_domains(organization_id);
ALTER TABLE competitor_domains ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_competitor_domains_updated_at BEFORE UPDATE ON competitor_domains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════════════════════════════
-- Seed data for Finance One (org cd9d1a8a-8d73-43a1-8b29-fd368ada9c82)
-- ══════════════════════════════════════════════════════════════

-- Competitor domains
INSERT INTO competitor_domains (organization_id, domain, label, is_primary) VALUES
  ('cd9d1a8a-8d73-43a1-8b29-fd368ada9c82', 'financeone.com.au', 'Finance One', TRUE),
  ('cd9d1a8a-8d73-43a1-8b29-fd368ada9c82', 'nowfinance.com.au', 'NOW Finance', FALSE),
  ('cd9d1a8a-8d73-43a1-8b29-fd368ada9c82', 'moneyme.com.au', 'MoneyMe', FALSE),
  ('cd9d1a8a-8d73-43a1-8b29-fd368ada9c82', 'plenti.com.au', 'Plenti', FALSE)
ON CONFLICT (organization_id, domain) DO NOTHING;

-- Latest snapshot (Mar 22, 2026) — data from Manus screenshots
INSERT INTO performance_snapshots (organization_id, domain, snapshot_date, category,
  performance_score, lcp_ms, tbt_ms, organic_traffic, keyword_count, domain_authority, backlinks_total, paid_traffic, ai_visibility,
  recommendations, metadata) VALUES
-- Finance One (primary)
('cd9d1a8a-8d73-43a1-8b29-fd368ada9c82', 'financeone.com.au', '2026-03-22', 'primary',
  62, 13400, 370, 13800, 6800, 28, 4800, 319, 29,
  '[
    {"id":"rec_1","title":"Optimize Mobile LCP","description":"Reduce Largest Contentful Paint from 13.4s to under 2.5s. Focus on image optimization, lazy loading, and server response times.","priority":"critical","category":"Performance","completed":false},
    {"id":"rec_2","title":"Reduce Total Blocking Time","description":"Audit and optimize JavaScript execution. Defer non-critical scripts and implement code splitting to reduce TBT below 200ms.","priority":"high","category":"Performance","completed":false},
    {"id":"rec_3","title":"Implement CDN for Assets","description":"Deploy a Content Delivery Network to serve images and static assets from geographically distributed servers.","priority":"high","category":"Performance","completed":false},
    {"id":"rec_4","title":"Build Backlink Strategy","description":"Develop a proactive link-building campaign targeting industry websites and finance blogs to increase from 4.8K to 10K+ backlinks.","priority":"high","category":"SEO","completed":false},
    {"id":"rec_5","title":"Expand Organic Keywords","description":"Conduct keyword research to identify 2K+ new keyword opportunities and create targeted content to reach 8K+ organic keywords.","priority":"high","category":"SEO","completed":false},
    {"id":"rec_6","title":"Launch Paid Search Campaign","description":"Test a targeted Google Ads campaign for high-value keywords (car loans, personal loans) to generate immediate visibility.","priority":"medium","category":"SEO","completed":false},
    {"id":"rec_7","title":"Enhance AI-Optimized Content","description":"Create authoritative, comprehensive content pieces designed to appear in AI-generated search results and increase AI Visibility score.","priority":"medium","category":"SEO","completed":false},
    {"id":"rec_8","title":"Monitor Core Web Vitals","description":"Set up continuous monitoring and alerts for Core Web Vitals to catch regressions early and track improvements over time.","priority":"medium","category":"Performance","completed":false}
  ]'::jsonb,
  '{"device":"mobile","source":"PageSpeed Insights + SEMrush"}'::jsonb),
-- NOW Finance (competitor)
('cd9d1a8a-8d73-43a1-8b29-fd368ada9c82', 'nowfinance.com.au', '2026-03-22', 'competitor',
  90, 1100, 170, 11500, NULL, 34, 6700, 12500, 30,
  '[]'::jsonb, '{}'::jsonb),
-- MoneyMe (competitor)
('cd9d1a8a-8d73-43a1-8b29-fd368ada9c82', 'moneyme.com.au', '2026-03-22', 'competitor',
  66, 800, 1030, 66400, NULL, 39, 30500, 0, 47,
  '[]'::jsonb, '{}'::jsonb),
-- Plenti (competitor)
('cd9d1a8a-8d73-43a1-8b29-fd368ada9c82', 'plenti.com.au', '2026-03-22', 'competitor',
  79, 900, 780, 48200, NULL, 42, 19600, 2500, 51,
  '[]'::jsonb, '{}'::jsonb)
ON CONFLICT (organization_id, domain, snapshot_date) DO NOTHING;
