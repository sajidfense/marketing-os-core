import { supabase } from './supabase.client';

interface LogUsageParams {
  organizationId: string;
  userId: string;
  skillType: string;
  tokensUsed: number;
  costEstimate: number;
}

export async function logUsage(params: LogUsageParams): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabase.from('ai_usage').insert({
    organization_id: params.organizationId,
    user_id:         params.userId,
    skill_type:      params.skillType,
    tokens_used:     params.tokensUsed,
    cost_estimate:   params.costEstimate,
    period_day:      today,
  });

  if (error) console.error('[usage.service] Failed to log usage:', error);
}

export async function getOrgUsageSummary(organizationId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('ai_usage')
    .select('skill_type, tokens_used, cost_estimate, period_day')
    .eq('organization_id', organizationId)
    .gte('period_day', since.toISOString().split('T')[0])
    .order('period_day', { ascending: false });

  if (error) throw error;
  return data;
}
