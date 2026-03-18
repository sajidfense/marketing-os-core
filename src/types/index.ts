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

export interface OrganizationUser {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'super_admin';
  invited_at: string;
  accepted_at: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

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
  report_title: string | null;
  footer_text: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Credits ─────────────────────────────────────────────────
export interface CreditPack {
  id: string;
  credits: number;
  priceUsd: number;
  label: string;
}

export interface CreditsData {
  credits_used: number;
  credits_limit: number;
  reset_date: string;
  days_until_reset: number;
  percent: number;
  costs: Record<string, number>;
  packs: CreditPack[];
}
