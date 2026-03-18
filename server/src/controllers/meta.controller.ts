import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

// ── Interfaces ──────────────────────────────────────────────────

/** Shape of a row in meta_connections */
export interface MetaConnection {
  id: string;
  organization_id: string;
  meta_user_id: string;
  access_token: string;
  page_id: string | null;
  page_name: string | null;
  ad_account_id: string | null;
  scopes: string[];
  connected_at: string;
  expires_at: string | null;
}

/** Shape of a row in meta_daily_snapshots */
export interface MetaDailySnapshot {
  id: string;
  organization_id: string;
  connection_id: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  conversions: number;
  ctr: number;
  cpm: number;
  cpc: number;
}

/** Aggregated overview response */
export interface MetaOverview {
  total_impressions: number;
  total_clicks: number;
  total_spend: number;
  total_reach: number;
  total_conversions: number;
  avg_ctr: number;
  avg_cpm: number;
  avg_cpc: number;
  days: number;
}

// ── OAuth: start ────────────────────────────────────────────────
export async function startOAuth(req: Request, res: Response): Promise<void> {
  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;

  if (!appId || !redirectUri) {
    res.status(500).json({ success: false, error: 'Meta OAuth is not configured' });
    return;
  }

  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'ads_read',
    'ads_management',
    'business_management',
  ].join(',');

  // TODO: Add state parameter with CSRF token for production use
  const oauthUrl =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&response_type=code` +
    `&state=${req.organizationId}`;

  res.json({ success: true, data: { url: oauthUrl } });
}

// ── OAuth: callback ─────────────────────────────────────────────
export async function handleCallback(req: Request, res: Response): Promise<void> {
  // TODO: Exchange `req.query.code` for a long-lived access token via the
  // Meta Graph API, store the token and page/ad-account info in
  // `meta_connections`, and redirect the user back to the dashboard.

  res.status(501).json({ success: false, error: 'Not implemented yet' });
}

// ── List connections ────────────────────────────────────────────
export async function listConnections(req: Request, res: Response): Promise<void> {
  const { organizationId } = req;

  const { data, error } = await supabase
    .from('meta_connections')
    .select('id, meta_user_id, page_id, page_name, ad_account_id, scopes, connected_at, expires_at')
    .eq('organization_id', organizationId)
    .order('connected_at', { ascending: false });

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch Meta connections' });
    return;
  }

  res.json({ success: true, data });
}

// ── Overview (aggregated) ───────────────────────────────────────
export async function getOverview(req: Request, res: Response): Promise<void> {
  const { organizationId } = req;
  const days = Math.min(Number(req.query.days ?? 30), 90);

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('meta_daily_snapshots')
    .select('impressions, clicks, spend, reach, conversions, ctr, cpm, cpc')
    .eq('organization_id', organizationId)
    .gte('date', sinceDate);

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch Meta overview' });
    return;
  }

  const rows = data ?? [];

  const overview: MetaOverview = {
    total_impressions:  rows.reduce((s, r) => s + (r.impressions ?? 0), 0),
    total_clicks:       rows.reduce((s, r) => s + (r.clicks ?? 0), 0),
    total_spend:        rows.reduce((s, r) => s + (r.spend ?? 0), 0),
    total_reach:        rows.reduce((s, r) => s + (r.reach ?? 0), 0),
    total_conversions:  rows.reduce((s, r) => s + (r.conversions ?? 0), 0),
    avg_ctr:            rows.length ? rows.reduce((s, r) => s + (r.ctr ?? 0), 0) / rows.length : 0,
    avg_cpm:            rows.length ? rows.reduce((s, r) => s + (r.cpm ?? 0), 0) / rows.length : 0,
    avg_cpc:            rows.length ? rows.reduce((s, r) => s + (r.cpc ?? 0), 0) / rows.length : 0,
    days:               rows.length,
  };

  res.json({ success: true, data: overview });
}

// ── Remove connection ───────────────────────────────────────────
export async function removeConnection(req: Request, res: Response): Promise<void> {
  const { organizationId } = req;
  const { id } = req.params;

  const { error, count } = await supabase
    .from('meta_connections')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to remove Meta connection' });
    return;
  }

  if (count === 0) {
    res.status(404).json({ success: false, error: 'Connection not found' });
    return;
  }

  res.status(204).send();
}
