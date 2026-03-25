import { z } from 'zod';
import { createCrudController } from '../lib/crudFactory';

const createSchema = z.object({
  title:        z.string().min(1),
  description:  z.string().optional(),
  status:       z.enum(['completed', 'in-progress', 'planned', 'at-risk']).optional(),
  target_date:  z.string().optional(),
  linked_items: z.array(z.object({ label: z.string(), type: z.string() })).optional(),
  dependencies: z.array(z.string()).optional(),
  sort_order:   z.number().int().optional(),
});

export const { list, create, getById, update, remove } = createCrudController({
  table: 'roadmap_milestones',
  createSchema,
  orderBy: 'sort_order',
});
