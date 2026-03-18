// ── AI Credit Costs per Skill ────────────────────────────────
// Each AI action has a fixed credit cost. Update here to adjust pricing.

export const CREDIT_COSTS: Record<string, number> = {
  'ad-copy':           1,
  'landing-page':      3,
  'email-sequence':    3,
  'funnel-strategy':   4,
  'campaign-strategy': 4,
  'video-script':      4,
  'social-caption':    1,
  'blog-planner':      3,
  'seo-analysis':      3,
  'seo-report':        5,
};

// Default cost for any skill not explicitly listed
export const DEFAULT_CREDIT_COST = 2;

// ── Plan Credit Limits ──────────────────────────────────────
export const PLAN_CREDIT_LIMITS: Record<string, number> = {
  free:       100,
  starter:    500,
  pro:        2000,
  enterprise: 10000,
};

export const DEFAULT_PLAN_LIMIT = 100;

// ── Credit Packs (Stripe one-time purchases) ────────────────
export interface CreditPack {
  id: string;
  credits: number;
  priceUsd: number;
  label: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'credits_100',  credits: 100,  priceUsd: 1000,  label: '100 credits — $10' },
  { id: 'credits_500',  credits: 500,  priceUsd: 4000,  label: '500 credits — $40' },
  { id: 'credits_1000', credits: 1000, priceUsd: 7000,  label: '1,000 credits — $70' },
];

// ── Warning Thresholds ──────────────────────────────────────
export const USAGE_WARNING_PERCENT = 80;
export const USAGE_BLOCKED_PERCENT = 100;

/**
 * Get the credit cost for a given skill type.
 */
export function getCreditCost(skillType: string): number {
  return CREDIT_COSTS[skillType] ?? DEFAULT_CREDIT_COST;
}
