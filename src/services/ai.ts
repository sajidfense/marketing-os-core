import { api, ApiError } from '@/services/api';
import type { ApiResponse } from '@/types';

/**
 * Run an AI skill via the backend API.
 * Uses the authenticated api client (auto-includes auth token + org ID).
 * Throws a typed error with code 'CREDITS_EXHAUSTED' when out of credits.
 */
export async function runAISkill<T = { content: string }>(
  skillName: string,
  payload: Record<string, unknown>,
): Promise<T> {
  try {
    const result = await api.post<ApiResponse<T>>(`/skills/${skillName}`, payload);
    if (!result.success || !result.data) {
      throw new Error('AI skill returned no data');
    }
    return result.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 402) {
      const body = err.body as { code?: string };
      const error = new Error('You\'ve run out of AI credits. Purchase more credits in Settings.') as Error & { code: string };
      error.code = body?.code ?? 'CREDITS_EXHAUSTED';
      throw error;
    }
    throw err;
  }
}

/**
 * Create a Stripe checkout session for plan upgrades.
 */
export async function createCheckoutSession(
  planId: string,
  organizationId: string,
): Promise<{ url: string }> {
  return api.post<{ url: string }>('/billing/create-checkout-session', {
    plan_id: planId,
    organization_id: organizationId,
  });
}
