import { z } from 'zod';
import { createCrudController } from '../lib/crudFactory';

const createSchema = z.object({
  name:      z.string().min(1),
  objective: z.string().optional(),
  status:    z.enum(['active', 'planning', 'completed', 'paused']).optional(),
  channels:  z.array(z.string()).optional(),
  budget:    z.number().optional(),
  timeframe: z.string().optional(),
  kpis:      z.array(z.object({ label: z.string(), target: z.string(), current: z.string() })).optional(),
  audiences: z.array(z.string()).optional(),
  metadata:  z.record(z.unknown()).optional(),
});

export const { list, create, getById, update, remove } = createCrudController({
  table: 'campaign_strategies',
  createSchema,
});
