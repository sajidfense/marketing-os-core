/**
 * Integrations Vault Service
 *
 * Responsible for:
 *  - Saving encrypted API keys (upsert per org + provider)
 *  - Returning connection status WITHOUT exposing keys
 *  - Decrypting keys for internal backend use only
 */

import { supabase } from '../lib/supabase';
import { encrypt, decrypt } from '../lib/crypto';

export type Provider = 'semrush' | 'google_ads' | 'openai';

export interface IntegrationRecord {
  id: string;
  organization_id: string;
  provider: Provider;
  api_key_encrypted: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Save (upsert) ─────────────────────────────────────────────────

export async function saveIntegrationKey(
  organizationId: string,
  provider: Provider,
  apiKey: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const apiKeyEncrypted = encrypt(apiKey);

  const { error } = await supabase
    .from('integrations')
    .upsert(
      {
        organization_id: organizationId,
        provider,
        api_key_encrypted: apiKeyEncrypted,
        metadata,
      },
      { onConflict: 'organization_id,provider' },
    );

  if (error) throw error;
}

// ── Status (per org) ──────────────────────────────────────────────

export interface IntegrationStatusItem {
  provider: Provider;
  connected: boolean;
  connectedAt: string | null;
  updatedAt: string | null;
}

export async function getIntegrationStatuses(
  organizationId: string,
): Promise<IntegrationStatusItem[]> {
  const allProviders: Provider[] = ['semrush', 'google_ads', 'openai'];

  const { data, error } = await supabase
    .from('integrations')
    .select('provider, created_at, updated_at')
    .eq('organization_id', organizationId);

  if (error) throw error;

  const byProvider = new Map(
    (data ?? []).map((row: { provider: string; created_at: string; updated_at: string }) => [
      row.provider,
      row,
    ]),
  );

  return allProviders.map((provider) => {
    const row = byProvider.get(provider);
    return {
      provider,
      connected: !!row,
      connectedAt: row?.created_at ?? null,
      updatedAt: row?.updated_at ?? null,
    };
  });
}

// ── Delete ────────────────────────────────────────────────────────

export async function deleteIntegrationKey(
  organizationId: string,
  provider: Provider,
): Promise<void> {
  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('organization_id', organizationId)
    .eq('provider', provider);

  if (error) throw error;
}

// ── Decrypt for internal use ──────────────────────────────────────
// NEVER expose the return value to any HTTP response.

export async function getDecryptedKey(
  organizationId: string,
  provider: Provider,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('integrations')
    .select('api_key_encrypted')
    .eq('organization_id', organizationId)
    .eq('provider', provider)
    .single();

  if (error && error.code === 'PGRST116') return null; // not found
  if (error) throw error;

  return decrypt(data.api_key_encrypted);
}
