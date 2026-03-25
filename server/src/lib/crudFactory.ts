/**
 * Generic CRUD controller factory.
 *
 * Generates list / create / getById / update / remove handlers
 * for any Supabase table that follows the standard org-scoped pattern.
 */

import { Request, Response } from 'express';
import { z, ZodObject, ZodRawShape } from 'zod';
import { supabase } from './supabase';

interface CrudOptions<T extends ZodRawShape> {
  table: string;
  createSchema: ZodObject<T>;
  /** Columns to select (default '*') */
  select?: string;
  /** Default ORDER BY column (default 'created_at') */
  orderBy?: string;
}

export function createCrudController<T extends ZodRawShape>(opts: CrudOptions<T>) {
  const { table, createSchema, select = '*', orderBy = 'created_at' } = opts;

  async function list(req: Request, res: Response): Promise<void> {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .eq('organization_id', req.organizationId)
      .order(orderBy, { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  }

  async function create(req: Request, res: Response): Promise<void> {
    const body = createSchema.parse(req.body);
    const { data, error } = await supabase
      .from(table)
      .insert({ ...body, organization_id: req.organizationId, created_by: req.userId })
      .select(select)
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  }

  async function getById(req: Request, res: Response): Promise<void> {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .eq('id', req.params.id)
      .eq('organization_id', req.organizationId)
      .single();
    if (error) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ success: true, data });
  }

  async function update(req: Request, res: Response): Promise<void> {
    const body = createSchema.partial().parse(req.body);
    const { data, error } = await supabase
      .from(table)
      .update(body)
      .eq('id', req.params.id)
      .eq('organization_id', req.organizationId)
      .select(select)
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  }

  async function remove(req: Request, res: Response): Promise<void> {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', req.params.id)
      .eq('organization_id', req.organizationId);
    if (error) throw error;
    res.status(204).send();
  }

  return { list, create, getById, update, remove };
}
