import { z } from 'zod';
import { createCrudController } from '../lib/crudFactory';

const createSchema = z.object({
  title:    z.string().min(1),
  category: z.enum(['technical', 'on-page', 'content', 'off-page']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status:   z.enum(['done', 'in-progress', 'todo']).optional(),
  impact:   z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const { list, create, getById, update, remove } = createCrudController({
  table: 'seo_tasks',
  createSchema,
});
