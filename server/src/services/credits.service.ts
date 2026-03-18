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

  console.log(`[credits] No usage record for org ${orgId}, provisioning...`);

  // Provision new usage row — look up org plan for limit
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single();

  if (orgErr) {
    console.error(`[credits] Failed to look up org plan for ${orgId}:`, orgErr.message);
  }

  const plan = org?.plan ?? 'free';
  const limit = PLAN_CREDIT_LIMITS[plan] ?? DEFAULT_PLAN_LIMIT;
  const resetDate = new Date();
  resetDate.setDate(resetDate.getDate() + 30);

  console.log(`[credits] Provisioning org ${orgId}: plan=${plan}, limit=${limit}`);

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
    console.error(`[credits] Failed to provision usage for org ${orgId}:`, insertErr?.message);
    // Return a safe default rather than throwing — allows the request to proceed
    return {
      id: '',
      organization_id: orgId,
      credits_used: 0,
      credits_limit: limit,
      reset_date: resetDate.toISOString(),
    };
  }

  console.log(`[credits] Provisioned usage for org ${orgId}: limit=${created.credits_limit}`);
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

  console.log(`[credits] Resetting credits for org ${usage.organization_id} (was ${usage.credits_used}/${usage.credits_limit})`);

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
    console.error(`[credits] Reset failed for org ${usage.organization_id}:`, error?.message);
    // Return with credits_used zeroed so the user isn't stuck
    return { ...usage, credits_used: 0, reset_date: newResetDate.toISOString() };
  }

  // Log the reset transaction (non-critical — don't throw on failure)
  await supabase.from('credit_transactions').insert({
    organization_id: usage.organization_id,
    credits: 0,
    type: 'reset',
    description: `Monthly credit reset. Previous usage: ${usage.credits_used}/${usage.credits_limit}`,
  }).then(({ error: txErr }) => {
    if (txErr) console.error(`[credits] Failed to log reset transaction:`, txErr.message);
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

  console.log(`[credits] Check: org=${orgId} skill=${skillType} cost=${cost} used=${usage.credits_used}/${usage.credits_limit}`);

  // Check if comped org (unlimited)
  const { data: org } = await supabase
    .from('organizations')
    .select('comped')
    .eq('id', orgId)
    .single();

  if (org?.comped) {
    console.log(`[credits] Org ${orgId} is comped — allowing`);
    return { allowed: true, usage, cost };
  }

  const allowed = usage.credits_used + cost <= usage.credits_limit;
  console.log(`[credits] Result: allowed=${allowed} (${usage.credits_used} + ${cost} ${allowed ? '<=' : '>'} ${usage.credits_limit})`);
  return { allowed, usage, cost };
}

// ── Consume credits (atomic increment) ──────────────────────
export async function consumeCredits(
  orgId: string,
  skillType: string,
  userId: string,
): Promise<UsageRecord> {
  const cost = getCreditCost(skillType);
  const usage = await getOrCreateUsage(orgId);
  const newUsed = Math.max(0, usage.credits_used + cost);

  console.log(`[credits] Consuming: org=${orgId} skill=${skillType} cost=${cost} ${usage.credits_used} -> ${newUsed}`);

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
    console.log(`[credits] Concurrency conflict for org ${orgId}, retrying...`);
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
      console.error(`[credits] Consume failed after retry for org ${orgId}:`, retryErr?.message);
      // Return current usage rather than throwing — the AI call can still proceed
      return { ...retryUsage, credits_used: retryUsed };
    }

    await logConsumeTransaction(orgId, cost, skillType, userId);
    return retryData as UsageRecord;
  }

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
  }).then(({ error }) => {
    if (error) console.error(`[credits] Failed to log consume transaction:`, error.message);
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
    console.error(`[credits] Failed to add purchased credits for org ${orgId}:`, error?.message);
    throw new Error('Failed to add purchased credits');
  }

  // Log transaction
  await supabase.from('credit_transactions').insert({
    organization_id: orgId,
    credits,
    type: 'purchase',
    description: `Purchased ${credits} credits`,
    stripe_session_id: stripeSessionId ?? null,
  }).then(({ error: txErr }) => {
    if (txErr) console.error(`[credits] Failed to log purchase transaction:`, txErr.message);
  });

  return data as UsageRecord;
}
