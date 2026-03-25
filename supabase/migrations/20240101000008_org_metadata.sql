-- =============================================
-- 008: Add metadata column to organizations
-- =============================================

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';
