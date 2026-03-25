import { z } from 'zod';
import { createCrudController } from '../lib/crudFactory';

const createSchema = z.object({
  name:          z.string().min(1),
  email:         z.string().email().optional().or(z.literal('')),
  company:       z.string().optional(),
  website:       z.string().optional(),
  stage:         z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']).optional(),
  value:         z.number().optional(),
  tags:          z.array(z.string()).optional(),
  last_activity: z.string().optional(),
  notes:         z.string().optional(),
});

export const { list, create, getById, update, remove } = createCrudController({
  table: 'leads',
  createSchema,
});
