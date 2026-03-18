const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function runAISkill(
  skillName: string,
  payload: Record<string, unknown>,
  token?: string,
): Promise<{ result: string }> {
  const res = await fetch(`${API_URL}/ai/run-skill`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ skill: skillName, payload }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `AI skill failed: ${res.status}`);
  }

  return res.json() as Promise<{ result: string }>;
}

export async function createCheckoutSession(
  planId: string,
  organizationId: string,
  token?: string,
): Promise<{ url: string }> {
  const res = await fetch(`${API_URL}/billing/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ plan_id: planId, organization_id: organizationId }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Checkout failed: ${res.status}`);
  }

  return res.json() as Promise<{ url: string }>;
}
