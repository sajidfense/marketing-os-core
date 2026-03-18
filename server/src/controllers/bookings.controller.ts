import { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

const createSchema = z.object({
  client_id:    z.string().uuid().optional(),
  title:        z.string().min(1),
  status:       z.enum(['pending','confirmed','completed','cancelled']).optional(),
  scheduled_at: z.string().datetime().optional(),
  notes:        z.string().optional(),
  metadata:     z.record(z.unknown()).optional(),
});

export async function list(req: Request, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('bookings').select('*').eq('organization_id', req.organizationId).order('created_at', { ascending: false });
  if (error) throw error;
  res.json({ success: true, data });
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const { data, error } = await supabase
    .from('bookings')
    .insert({ ...body, organization_id: req.organizationId, created_by: req.userId })
    .select().single();
  if (error) throw error;
  res.status(201).json({ success: true, data });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('bookings').select('*').eq('id', req.params.id).eq('organization_id', req.organizationId).single();
  if (error) { res.status(404).json({ error: 'Booking not found' }); return; }
  res.json({ success: true, data });
}

export async function update(req: Request, res: Response): Promise<void> {
  const body = createSchema.partial().parse(req.body);
  const { data, error } = await supabase
    .from('bookings').update(body).eq('id', req.params.id).eq('organization_id', req.organizationId).select().single();
  if (error) throw error;
  res.json({ success: true, data });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { error } = await supabase
    .from('bookings').delete().eq('id', req.params.id).eq('organization_id', req.organizationId);
  if (error) throw error;
  res.status(204).send();
}
