import { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../services/supabase.client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const createSchema = z.object({
  campaign_id: z.string().uuid().optional(),
  name:        z.string().min(1),
  status:      z.enum(['draft','active','paused','completed']).optional(),
  steps:       z.array(z.record(z.unknown())).optional(),
  metadata:    z.record(z.unknown()).optional(),
});

export async function list(req: Request, res: Response): Promise<void> {
  const { organizationId } = req as AuthenticatedRequest;
  const { data, error } = await supabase
    .from('workflows').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false });
  if (error) throw error;
  res.json({ success: true, data });
}

export async function create(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const body = createSchema.parse(req.body);
  const { data, error } = await supabase
    .from('workflows')
    .insert({ ...body, organization_id: authReq.organizationId, created_by: authReq.userId })
    .select().single();
  if (error) throw error;
  res.status(201).json({ success: true, data });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { organizationId } = req as AuthenticatedRequest;
  const { data, error } = await supabase
    .from('workflows').select('*').eq('id', req.params.id).eq('organization_id', organizationId).single();
  if (error) { res.status(404).json({ error: 'Workflow not found' }); return; }
  res.json({ success: true, data });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { organizationId } = req as AuthenticatedRequest;
  const body = createSchema.partial().parse(req.body);
  const { data, error } = await supabase
    .from('workflows').update(body).eq('id', req.params.id).eq('organization_id', organizationId).select().single();
  if (error) throw error;
  res.json({ success: true, data });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { organizationId } = req as AuthenticatedRequest;
  const { error } = await supabase
    .from('workflows').delete().eq('id', req.params.id).eq('organization_id', organizationId);
  if (error) throw error;
  res.status(204).send();
}
