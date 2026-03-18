import { supabase } from '../lib/supabase';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? '';

const SCOPES = ['https://www.googleapis.com/auth/adwords'];

// ── OAuth helpers ─────────────────────────────────────────────────

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }>;
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) throw new Error('Failed to refresh Google access token');

  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
  }>;
}

// ── DB operations ─────────────────────────────────────────────────

export async function storeGoogleTokens(
  organizationId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  customerId?: string,
) {
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  const { error } = await supabase.from('google_integrations').upsert(
    {
      organization_id: organizationId,
      access_token: accessToken,
      refresh_token: refreshToken,
      customer_id: customerId ?? null,
      token_expires_at: tokenExpiresAt,
      scopes: SCOPES,
      is_active: true,
    },
    { onConflict: 'organization_id' },
  );

  if (error) throw error;
}

export async function getGoogleIntegration(organizationId: string) {
  const { data, error } = await supabase
    .from('google_integrations')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

export async function disconnectGoogle(organizationId: string) {
  const { error } = await supabase
    .from('google_integrations')
    .update({ is_active: false })
    .eq('organization_id', organizationId);

  if (error) throw error;
}

// ── Campaign data (mock-ready, replace with real Google Ads API) ──

export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
}

export async function fetchGoogleAdsCampaigns(
  _organizationId: string,
): Promise<GoogleAdsCampaign[]> {
  // TODO: Replace with real Google Ads API call using stored tokens
  // For now, return mock data that demonstrates the UI
  return [
    {
      id: 'camp-1',
      name: 'Brand Awareness Q1',
      status: 'ENABLED',
      spend: 4250.00,
      impressions: 182400,
      clicks: 3648,
      conversions: 142,
      ctr: 2.0,
      cpc: 1.16,
    },
    {
      id: 'camp-2',
      name: 'Lead Gen — Landing Page A',
      status: 'ENABLED',
      spend: 2890.50,
      impressions: 95200,
      clicks: 2856,
      conversions: 98,
      ctr: 3.0,
      cpc: 1.01,
    },
    {
      id: 'camp-3',
      name: 'Retargeting — Cart Abandoners',
      status: 'ENABLED',
      spend: 1540.25,
      impressions: 48100,
      clicks: 1924,
      conversions: 76,
      ctr: 4.0,
      cpc: 0.80,
    },
    {
      id: 'camp-4',
      name: 'Competitor Keywords',
      status: 'PAUSED',
      spend: 890.00,
      impressions: 32500,
      clicks: 975,
      conversions: 28,
      ctr: 3.0,
      cpc: 0.91,
    },
    {
      id: 'camp-5',
      name: 'Product Launch — Summer',
      status: 'ENABLED',
      spend: 3200.75,
      impressions: 120000,
      clicks: 4200,
      conversions: 165,
      ctr: 3.5,
      cpc: 0.76,
    },
  ];
}

export interface GoogleAdsOverview {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
  roas: number;
  spendOverTime: { date: string; spend: number }[];
  conversionsOverTime: { date: string; conversions: number }[];
}

export async function fetchGoogleAdsOverview(
  _organizationId: string,
): Promise<GoogleAdsOverview> {
  // TODO: Replace with real API aggregation
  return {
    totalSpend: 12771.50,
    totalImpressions: 478200,
    totalClicks: 13603,
    totalConversions: 509,
    avgCtr: 2.84,
    avgCpc: 0.94,
    roas: 4.2,
    spendOverTime: [
      { date: 'Mon', spend: 1850 },
      { date: 'Tue', spend: 2100 },
      { date: 'Wed', spend: 1950 },
      { date: 'Thu', spend: 2300 },
      { date: 'Fri', spend: 1870 },
      { date: 'Sat', spend: 1450 },
      { date: 'Sun', spend: 1251 },
    ],
    conversionsOverTime: [
      { date: 'Mon', conversions: 68 },
      { date: 'Tue', conversions: 82 },
      { date: 'Wed', conversions: 74 },
      { date: 'Thu', conversions: 91 },
      { date: 'Fri', conversions: 77 },
      { date: 'Sat', conversions: 58 },
      { date: 'Sun', conversions: 59 },
    ],
  };
}
