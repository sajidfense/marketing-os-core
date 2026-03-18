import { supabase } from './supabase';

/**
 * Checks whether an organization has an active subscription or is comped.
 *
 * Use this wherever you need to gate features behind billing:
 *
 *   if (!await isOrgBillingActive(orgId)) {
 *     return res.status(402).json({ error: 'Active subscription required' });
 *   }
 *
 * Comped orgs always pass this check.
 */
export async function isOrgBillingActive(organizationId: string): Promise<boolean> {
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_status, comped')
    .eq('id', organizationId)
    .single();

  if (!org) return false;

  // Comped orgs bypass Stripe billing
  if (org.comped) return true;

  return org.subscription_status === 'active';
}
