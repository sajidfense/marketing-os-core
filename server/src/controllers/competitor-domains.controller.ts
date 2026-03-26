import { z } from 'zod';
import { createCrudController } from '../lib/crudFactory';

const createSchema = z.object({
  domain:     z.string().min(1),
  label:      z.string().optional(),
  is_primary: z.boolean().optional(),
  metadata:   z.record(z.any()).optional(),
});

export const { list, create, getById, update, remove } = createCrudController({
  table: 'competitor_domains',
  createSchema,
});
