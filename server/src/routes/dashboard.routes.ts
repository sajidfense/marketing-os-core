import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', async (req: Request, res: Response): Promise<void> => {
  const orgId = req.organizationId;

  const [campaigns, bookings, workflows, aiGenerations] = await Promise.all([
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('workflows').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('ai_generations').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
  ]);

  res.json({
    success: true,
    data: {
      campaigns: campaigns.count ?? 0,
      bookings: bookings.count ?? 0,
      workflows: workflows.count ?? 0,
      aiGenerations: aiGenerations.count ?? 0,
    },
  });
});
