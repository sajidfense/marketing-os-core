// Thin orchestration layer — extended booking logic goes here
// Controllers call this for complex operations beyond simple CRUD
import { supabase } from '../lib/supabase';

export async function getBookingsByClient(orgId: string, clientId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('organization_id', orgId)
    .eq('client_id', clientId)
    .order('scheduled_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getUpcomingBookings(orgId: string, daysAhead = 7) {
  const now = new Date().toISOString();
  const future = new Date(Date.now() + daysAhead * 86400000).toISOString();
  const { data, error } = await supabase
    .from('bookings')
    .select('*, clients(name, email)')
    .eq('organization_id', orgId)
    .eq('status', 'confirmed')
    .gte('scheduled_at', now)
    .lte('scheduled_at', future)
    .order('scheduled_at', { ascending: true });
  if (error) throw error;
  return data;
}
