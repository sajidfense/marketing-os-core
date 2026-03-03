import { supabase } from './supabase.client';

export async function getCampaignWithWorkflows(orgId: string, campaignId: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, workflows(*), ai_generations(*)')
    .eq('id', campaignId)
    .eq('organization_id', orgId)
    .single();
  if (error) throw error;
  return data;
}

export async function getCampaignStats(orgId: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('status')
    .eq('organization_id', orgId);
  if (error) throw error;

  return (data ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
}
