-- =============================================
-- 007: Integrations Vault — Encrypted API Keys
-- =============================================

CREATE TABLE integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL CHECK (provider IN ('semrush', 'google_ads', 'openai')),
  api_key_encrypted TEXT NOT NULL,       -- AES-256-GCM: iv:authTag:ciphertext (base64)
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, provider)
);

-- ---- INDEXES ----
CREATE INDEX idx_integrations_org ON integrations(organization_id);
CREATE INDEX idx_integrations_org_provider ON integrations(organization_id, provider);

-- ---- RLS ----
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Service-role only — no direct browser access
-- (The service_role key bypasses RLS, so these policies
--  intentionally block anon/authenticated roles.)
CREATE POLICY "Deny all direct access to integrations"
  ON integrations FOR ALL
  USING (false);

-- ---- UPDATED_AT TRIGGER ----
CREATE TRIGGER trg_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
