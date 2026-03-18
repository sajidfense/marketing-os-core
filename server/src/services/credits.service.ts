import { supabase } from '../lib/supabase';
import { getCreditCost, PLAN_CREDIT_LIMITS, DEFAULT_PLAN_LIMIT } from '../config/credits';

export interface UsageRecord {
  id: string;
  organization_id: string;
  credits_used: number;
  credits_limit: number;
  reset_date: string;
}

// ── Get or provision usage row ──────────────────────────────
export async function getOrCreateUsage(orgId: string): Promise<UsageRecord> {
  // Try to fetch existing
  const { data, error } = await supabase
    .from('organization_usage')
    .select('*')
    .eq('organization_id', orgId)
    .single();

  if (data && !error) {
    // Check if reset is due
    return await maybeResetCredits(data as UsageRecord);
  }

  // Provision new usage row — look up org plan for limit
  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single();

  const plan = org?.plan ?? 'free';
  const limit = PLAN_CREDIT_LIMITS[plan] ?? DEFAULT_PLAN_LIMIT;
  const resetDate = new Date();
  resetDate.setDate(resetDate.getDate() + 30);

  const { data: created, error: insertErr } = await supabase
    .from('organization_usage')
    .upsert(
      {
        organization_id: orgId,
        credits_used: 0,
        credits_limit: limit,
        reset_date: resetDate.toISOString(),
      },
      { onConflict: 'organization_id' },
    )
    .select('*')
    .single();

  if (insertErr || !created) {
    throw new Error('Failed to provision credit usage record');
  }

  return created as UsageRecord;
}

// ── Auto-reset if past reset_date ───────────────────────────
async function maybeResetCredits(usage: UsageRecord): Promise<UsageRecord> {
  const now = new Date();
  const resetDate = new Date(usage.reset_date);

  if (now <= resetDate) return usage;

  // Reset is due
  const newResetDate = new Date();
  newResetDate.setDate(newResetDate.getDate() + 30);

  const { data, error } = await supabase
    .from('organization_usage')
    .update({
      credits_used: 0,
      reset_date: newResetDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', usage.id)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error('Failed to reset credits');
  }

  // Log the reset transaction
  await supabase.from('credit_transactions').insert({
    organization_id: usage.organization_id,
    credits: 0,
    type: 'reset',
    description: `Monthly credit reset. Previous usage: ${usage.credits_used}/${usage.credits_limit}`,
  });

  return data as UsageRecord;
}

// ── Check if org has enough credits ─────────────────────────
export async function checkCredits(
  orgId: string,
  skillType: string,
): Promise<{ allowed: boolean; usage: UsageRecord; cost: number }> {
  const usage = await getOrCreateUsage(orgId);
  const cost = getCreditCost(skillType);

  // Check if comped org (unlimited)
  const { data: org } = await supabase
    .from('organizations')
    .select('comped')
    .eq('id', orgId)
    .single();

  if (org?.comped) {
    return { allowed: true, usage, cost };
  }

  const allowed = usage.credits_used + cost <= usage.credits_limit;
  return { allowed, usage, cost };
}

// ── Consume credits (atomic increment) ──────────────────────
export async function consumeCredits(
  orgId: string,
  skillType: string,
  userId: string,
): Promise<UsageRecord> {
  const cost = getCreditCost(skillType);

  // Atomic increment using RPC-style update
  // First get current value to ensure we don't go negative
  const usage = await getOrCreateUsage(orgId);
  const newUsed = Math.max(0, usage.credits_used + cost);

  const { data, error } = await supabase
    .from('organization_usage')
    .update({
      credits_used: newUsed,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('credits_used', usage.credits_used) // optimistic concurrency check
    .select('*')
    .single();

  if (error || !data) {
    // Retry once on concurrency conflict
    const retryUsage = await getOrCreateUsage(orgId);
    const retryUsed = Math.max(0, retryUsage.credits_used + cost);

    const { data: retryData, error: retryErr } = await supabase
      .from('organization_usage')
      .update({
        credits_used: retryUsed,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', orgId)
      .select('*')
      .single();

    if (retryErr || !retryData) {
      throw new Error('Failed to consume credits (concurrency conflict)');
    }

    // Log transaction
    await logConsumeTransaction(orgId, cost, skillType, userId);
    return retryData as UsageRecord;
  }

  // Log transaction
  await logConsumeTransaction(orgId, cost, skillType, userId);
  return data as UsageRecord;
}

async function logConsumeTransaction(
  orgId: string,
  cost: number,
  skillType: string,
  userId: string,
): Promise<void> {
  await supabase.from('credit_transactions').insert({
    organization_id: orgId,
    credits: -cost,
    type: 'consume',
    description: `AI skill: ${skillType} (user: ${userId})`,
  });
}

// ── Add purchased credits ───────────────────────────────────
export async function addPurchasedCredits(
  orgId: string,
  credits: number,
  stripeSessionId?: string,
): Promise<UsageRecord> {
  const usage = await getOrCreateUsage(orgId);
  const newLimit = usage.credits_limit + credits;

  const { data, error } = await supabase
    .from('organization_usage')
    .update({
      credits_limit: newLimit,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error('Failed to add purchased credits');
  }

  // Log transaction
  await supabase.from('credit_transactions').insert({
    organization_id: orgId,
    credits,
    type: 'purchase',
    description: `Purchased ${credits} credits`,
    stripe_session_id: stripeSessionId ?? null,
  });

  return data as UsageRecord;
}
