-- =============================================
-- marketing-os-core :: RLS Policies
-- Defense-in-depth: these policies protect data
-- even if the anon key is used directly.
-- The service role key bypasses RLS by design.
-- =============================================

-- Helper: check if the current JWT user is a member of an org
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_id = org_id
      AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get role in org
CREATE OR REPLACE FUNCTION public.org_role(org_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM organization_users
  WHERE organization_id = org_id
    AND user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ── ORGANIZATIONS ──────────────────────────────────────────────

CREATE POLICY "Users can view orgs they belong to"
  ON organizations FOR SELECT
  USING (is_org_member(id));

CREATE POLICY "Only owners can update org"
  ON organizations FOR UPDATE
  USING (org_role(id) = 'owner')
  WITH CHECK (org_role(id) = 'owner');


-- ── ORGANIZATION_USERS ─────────────────────────────────────────

CREATE POLICY "Members can view org membership"
  ON organization_users FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Owners/admins can insert members"
  ON organization_users FOR INSERT
  WITH CHECK (org_role(organization_id) IN ('owner', 'admin'));

CREATE POLICY "Owners can update member roles"
  ON organization_users FOR UPDATE
  USING (org_role(organization_id) = 'owner')
  WITH CHECK (org_role(organization_id) = 'owner');

CREATE POLICY "Owners can remove members"
  ON organization_users FOR DELETE
  USING (org_role(organization_id) = 'owner');


-- ── CLIENTS ────────────────────────────────────────────────────

CREATE POLICY "Members can view org clients"
  ON clients FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Members can create clients"
  ON clients FOR INSERT
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Members can update org clients"
  ON clients FOR UPDATE
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Owners/admins can delete clients"
  ON clients FOR DELETE
  USING (org_role(organization_id) IN ('owner', 'admin'));


-- ── BOOKINGS ───────────────────────────────────────────────────

CREATE POLICY "Members can view org bookings"
  ON bookings FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Members can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Members can update org bookings"
  ON bookings FOR UPDATE
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Owners/admins can delete bookings"
  ON bookings FOR DELETE
  USING (org_role(organization_id) IN ('owner', 'admin'));


-- ── CAMPAIGNS ──────────────────────────────────────────────────

CREATE POLICY "Members can view org campaigns"
  ON campaigns FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Members can create campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Members can update org campaigns"
  ON campaigns FOR UPDATE
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Owners/admins can delete campaigns"
  ON campaigns FOR DELETE
  USING (org_role(organization_id) IN ('owner', 'admin'));


-- ── WORKFLOWS ──────────────────────────────────────────────────

CREATE POLICY "Members can view org workflows"
  ON workflows FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Members can create workflows"
  ON workflows FOR INSERT
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Members can update org workflows"
  ON workflows FOR UPDATE
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Owners/admins can delete workflows"
  ON workflows FOR DELETE
  USING (org_role(organization_id) IN ('owner', 'admin'));


-- ── AI_GENERATIONS ─────────────────────────────────────────────

CREATE POLICY "Members can view org AI generations"
  ON ai_generations FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Members can insert AI generations"
  ON ai_generations FOR INSERT
  WITH CHECK (is_org_member(organization_id));


-- ── AI_USAGE ───────────────────────────────────────────────────

CREATE POLICY "Members can view org AI usage"
  ON ai_usage FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Members can insert AI usage"
  ON ai_usage FOR INSERT
  WITH CHECK (is_org_member(organization_id));


-- ── SUBSCRIPTIONS ──────────────────────────────────────────────

CREATE POLICY "Members can view org subscription"
  ON subscriptions FOR SELECT
  USING (is_org_member(organization_id));

-- Only server (service role) should insert/update subscriptions via Stripe webhooks
-- No INSERT/UPDATE/DELETE policies for anon/authenticated roles


-- ── BRANDING_SETTINGS ──────────────────────────────────────────

CREATE POLICY "Members can view org branding"
  ON branding_settings FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Owners/admins can upsert branding"
  ON branding_settings FOR INSERT
  WITH CHECK (org_role(organization_id) IN ('owner', 'admin'));

CREATE POLICY "Owners/admins can update branding"
  ON branding_settings FOR UPDATE
  USING (org_role(organization_id) IN ('owner', 'admin'))
  WITH CHECK (org_role(organization_id) IN ('owner', 'admin'));


-- ── META_CONNECTIONS ───────────────────────────────────────────

CREATE POLICY "Members can view org Meta connections"
  ON meta_connections FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Owners/admins can manage Meta connections"
  ON meta_connections FOR INSERT
  WITH CHECK (org_role(organization_id) IN ('owner', 'admin'));

CREATE POLICY "Owners/admins can update Meta connections"
  ON meta_connections FOR UPDATE
  USING (org_role(organization_id) IN ('owner', 'admin'))
  WITH CHECK (org_role(organization_id) IN ('owner', 'admin'));

CREATE POLICY "Owners/admins can delete Meta connections"
  ON meta_connections FOR DELETE
  USING (org_role(organization_id) IN ('owner', 'admin'));


-- ── META_DAILY_SNAPSHOTS ──────────────────────────────────────

CREATE POLICY "Members can view org Meta snapshots"
  ON meta_daily_snapshots FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Service can insert Meta snapshots"
  ON meta_daily_snapshots FOR INSERT
  WITH CHECK (is_org_member(organization_id));


-- ── META_CAMPAIGN_DAILY ───────────────────────────────────────

CREATE POLICY "Members can view org Meta campaign data"
  ON meta_campaign_daily FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Service can insert Meta campaign data"
  ON meta_campaign_daily FOR INSERT
  WITH CHECK (is_org_member(organization_id));


-- ── META_AI_REPORTS ───────────────────────────────────────────

CREATE POLICY "Members can view org Meta reports"
  ON meta_ai_reports FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Members can create Meta reports"
  ON meta_ai_reports FOR INSERT
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Members can update own org reports"
  ON meta_ai_reports FOR UPDATE
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_member(organization_id));


-- ── USERS ──────────────────────────────────────────────────────
-- Users table mirrors auth.users; users can only read/update their own row

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
