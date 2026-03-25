import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import {
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  storeGoogleTokens,
  getGoogleIntegration,
  disconnectGoogle,
  fetchGoogleAdsCampaigns,
  fetchGoogleAdsOverview,
} from '../services/google.service';
import {
  fetchKeywords,
  fetchDomainOverview,
} from '../services/semrush.service';
import {
  saveIntegrationKey,
  getIntegrationStatuses,
  deleteIntegrationKey,
  type Provider,
} from '../services/vault.service';

export const integrationsRouter = Router();

// ═══════════════════════════════════════════════════════════════════
// GOOGLE ADS
// ═══════════════════════════════════════════════════════════════════

// ── Connect (redirect to Google OAuth) ────────────────────────────
integrationsRouter.post('/google/connect', (req: Request, res: Response) => {
  const state = JSON.stringify({ organizationId: req.organizationId });
  const encodedState = Buffer.from(state).toString('base64url');
  const url = getGoogleAuthUrl(encodedState);
  res.json({ success: true, data: { url } });
});

// ── OAuth callback ────────────────────────────────────────────────
integrationsRouter.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Missing authorization code' });
      return;
    }

    let organizationId: string;
    try {
      const decoded = JSON.parse(Buffer.from(state as string, 'base64url').toString());
      organizationId = decoded.organizationId;
    } catch {
      res.status(400).json({ error: 'Invalid state parameter' });
      return;
    }

    const tokens = await exchangeCodeForTokens(code);

    await storeGoogleTokens(
      organizationId,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in,
    );

    // Redirect back to the integrations page
    const frontendUrl = process.env.FRONTEND_URL ?? 'https://marketingos-smoky.vercel.app';
    res.redirect(`${frontendUrl}/integrations?google=connected`);
  } catch (err) {
    console.error('[google/callback] Error:', err);
    res.status(500).json({ error: 'Failed to connect Google account' });
  }
});

// ── Status ────────────────────────────────────────────────────────
integrationsRouter.get('/google/status', asyncHandler(async (req: Request, res: Response) => {
  const integration = await getGoogleIntegration(req.organizationId!);
  res.json({
    success: true,
    data: {
      connected: !!integration?.is_active,
      customerId: integration?.customer_id ?? null,
      connectedAt: integration?.created_at ?? null,
    },
  });
}));

// ── Disconnect ────────────────────────────────────────────────────
integrationsRouter.post('/google/disconnect', asyncHandler(async (req: Request, res: Response) => {
  await disconnectGoogle(req.organizationId!);
  res.json({ success: true });
}));

// ── Campaigns ─────────────────────────────────────────────────────
integrationsRouter.get('/google/campaigns', asyncHandler(async (req: Request, res: Response) => {
  const campaigns = await fetchGoogleAdsCampaigns(req.organizationId!);
  res.json({ success: true, data: campaigns });
}));

// ── Overview ──────────────────────────────────────────────────────
integrationsRouter.get('/google/overview', asyncHandler(async (req: Request, res: Response) => {
  const overview = await fetchGoogleAdsOverview(req.organizationId!);
  res.json({ success: true, data: overview });
}));

// ═══════════════════════════════════════════════════════════════════
// SEMRUSH
// ═══════════════════════════════════════════════════════════════════

const keywordSchema = z.object({
  keyword: z.string().min(1).max(200),
  database: z.string().max(5).default('us'),
});

const domainSchema = z.object({
  domain: z.string().min(1).max(200),
  database: z.string().max(5).default('us'),
});

// ── Keyword research ──────────────────────────────────────────────
integrationsRouter.get('/semrush/keywords', async (req: Request, res: Response) => {
  const parsed = keywordSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.flatten() });
    return;
  }

  const results = await fetchKeywords(parsed.data.keyword, req.organizationId!, parsed.data.database);
  res.json({ success: true, data: results });
});

// ── Domain overview ───────────────────────────────────────────────
integrationsRouter.get('/semrush/domain-overview', async (req: Request, res: Response) => {
  const parsed = domainSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.flatten() });
    return;
  }

  const overview = await fetchDomainOverview(parsed.data.domain, req.organizationId!, parsed.data.database);
  res.json({ success: true, data: overview });
});

// ═══════════════════════════════════════════════════════════════════
// INTEGRATIONS VAULT — Encrypted API Key Management
// ═══════════════════════════════════════════════════════════════════

const VALID_PROVIDERS: Provider[] = ['semrush', 'google_ads', 'openai'];

const saveKeySchema = z.object({
  provider: z.enum(['semrush', 'google_ads', 'openai']),
  api_key: z.string().min(1, 'API key is required').max(500, 'API key too long'),
});

// ── Save API key (encrypt + upsert) ──────────────────────────────
integrationsRouter.post('/vault/save', async (req: Request, res: Response) => {
  try {
    const parsed = saveKeySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { provider, api_key } = parsed.data;

    await saveIntegrationKey(req.organizationId!, provider, api_key);

    res.json({ success: true, message: `${provider} API key saved securely` });
  } catch (err) {
    console.error('[vault/save] Error:', err);
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

// ── Vault status (connected / not connected — NO keys returned) ──
integrationsRouter.get('/vault/status', async (req: Request, res: Response) => {
  try {
    const statuses = await getIntegrationStatuses(req.organizationId!);
    res.json({ success: true, data: statuses });
  } catch (err) {
    console.error('[vault/status] Error:', err);
    res.status(500).json({ error: 'Failed to load integration statuses' });
  }
});

// ── Delete an integration key ────────────────────────────────────
integrationsRouter.delete('/vault/:provider', async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as Provider;
    if (!VALID_PROVIDERS.includes(provider)) {
      res.status(400).json({ error: `Invalid provider: ${provider}` });
      return;
    }

    await deleteIntegrationKey(req.organizationId!, provider);
    res.json({ success: true, message: `${provider} integration disconnected` });
  } catch (err) {
    console.error('[vault/delete] Error:', err);
    res.status(500).json({ error: 'Failed to disconnect integration' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// STATUS (all integrations — combined legacy + vault)
// ═══════════════════════════════════════════════════════════════════

integrationsRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const [google, vaultStatuses] = await Promise.all([
      getGoogleIntegration(req.organizationId!),
      getIntegrationStatuses(req.organizationId!),
    ]);

    // Build vault status map
    const vault: Record<string, { connected: boolean; connectedAt: string | null }> = {};
    for (const s of vaultStatuses) {
      vault[s.provider] = { connected: s.connected, connectedAt: s.connectedAt };
    }

    res.json({
      success: true,
      data: {
        google: {
          connected: !!google?.is_active,
          connectedAt: google?.created_at ?? null,
        },
        vault,
      },
    });
  } catch (err) {
    console.error('[integrations/status] Error:', err);
    res.status(500).json({ error: 'Failed to load integration statuses' });
  }
});
