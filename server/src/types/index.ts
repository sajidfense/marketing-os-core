// ── Core entities ────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  is_active: boolean;
  subscription_status: 'active' | 'inactive';
  comped: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationUser {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'super_admin';
  invited_at: string;
  accepted_at: string | null;
}

// ── Branding ─────────────────────────────────────────────────────

export interface BrandingSettings {
  id: string;
  organization_id: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  accent_color: string;
  custom_domain: string | null;
  app_name: string | null;
  email_from_name: string | null;
  email_from_address: string | null;
  support_email: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Billing ──────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  organization_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Campaigns & Workflows ────────────────────────────────────────

export interface Campaign {
  id: string;
  organization_id: string;
  client_id: string | null;
  name: string;
  type: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  goal: string | null;
  target_audience: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  organization_id: string;
  client_id: string | null;
  title: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  scheduled_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  organization_id: string;
  campaign_id: string | null;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  steps: Record<string, unknown>[];
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── AI ───────────────────────────────────────────────────────────

export interface AIGeneration {
  id: string;
  organization_id: string;
  user_id: string;
  skill_type: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_estimate: number;
  campaign_id: string | null;
  client_id: string | null;
  created_at: string;
}

export interface AIUsage {
  id: string;
  organization_id: string;
  user_id: string;
  skill_type: string;
  tokens_used: number;
  cost_estimate: number;
  period_day: string;
  created_at: string;
}

// ── Meta (Facebook / Instagram) ──────────────────────────────────

export interface MetaConnection {
  id: string;
  organization_id: string;
  meta_user_id: string;
  page_id: string | null;
  page_name: string | null;
  access_token: string;
  token_expires_at: string | null;
  scopes: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MetaDailySnapshot {
  id: string;
  organization_id: string;
  connection_id: string;
  snapshot_date: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  conversions: number;
  cpm: number;
  cpc: number;
  ctr: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MetaAIReport {
  id: string;
  organization_id: string;
  connection_id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  summary: string;
  recommendations: string[];
  raw_data: Record<string, unknown>;
  model: string;
  tokens_used: number;
  cost_estimate: number;
  created_at: string;
}

// ── API helpers ──────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}
