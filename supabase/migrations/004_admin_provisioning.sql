-- =============================================
-- 004: Admin Provisioning Support
-- Adds comped flag + subscription_status to organizations
-- Adds super_admin role support to organization_users
-- =============================================

-- ---- Add comped + subscription_status to organizations ----
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (subscription_status IN ('active', 'inactive')),
  ADD COLUMN IF NOT EXISTS comped BOOLEAN NOT NULL DEFAULT FALSE;

-- Set existing active orgs to 'active' status
UPDATE organizations SET subscription_status = 'active' WHERE is_active = TRUE;

-- ---- Extend organization_users role check to include super_admin ----
ALTER TABLE organization_users DROP CONSTRAINT IF EXISTS organization_users_role_check;
ALTER TABLE organization_users
  ADD CONSTRAINT organization_users_role_check
    CHECK (role IN ('owner', 'admin', 'member', 'super_admin'));

-- ---- Index for quick admin lookups ----
CREATE INDEX IF NOT EXISTS idx_org_users_role ON organization_users(role);
