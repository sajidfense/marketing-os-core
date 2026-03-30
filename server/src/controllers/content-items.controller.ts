import { z } from 'zod';
import { createCrudController } from '../lib/crudFactory';

const createSchema = z.object({
  title:           z.string().min(1),
  content_type:    z.enum(['blog', 'social', 'video', 'email']).optional(),
  status:          z.enum(['draft', 'scheduled', 'published']).optional(),
  scheduled_day:   z.number().int().min(1).max(31).optional(),
  scheduled_month: z.number().int().min(1).max(12).optional(),
  scheduled_year:  z.number().int().optional(),
  body:            z.string().optional(),
  metadata:        z.record(z.unknown()).optional(),
});

export const { list, create, getById, update, remove } = createCrudController({
  table: 'content_items',
  createSchema,
});
