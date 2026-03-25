import { z } from 'zod';
import { createCrudController } from '../lib/crudFactory';

const createSchema = z.object({
  name:       z.string().min(1),
  asset_type: z.enum(['image', 'video', 'document', 'audio']).optional(),
  tags:       z.array(z.string()).optional(),
  file_size:  z.string().optional(),
  file_url:   z.string().url().optional().or(z.literal('')),
  campaign:   z.string().optional(),
  metadata:   z.record(z.unknown()).optional(),
});

export const { list, create, getById, update, remove } = createCrudController({
  table: 'creative_assets',
  createSchema,
});
