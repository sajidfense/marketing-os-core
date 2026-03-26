import { z } from 'zod';
import { createCrudController } from '../lib/crudFactory';

const createSchema = z.object({
  domain:            z.string().min(1),
  snapshot_date:     z.string().optional(),
  category:          z.enum(['primary', 'competitor']).optional(),
  performance_score: z.number().int().min(0).max(100).optional().nullable(),
  lcp_ms:            z.number().int().optional().nullable(),
  tbt_ms:            z.number().int().optional().nullable(),
  cls_score:         z.number().optional().nullable(),
  fcp_ms:            z.number().int().optional().nullable(),
  organic_traffic:   z.number().int().optional().nullable(),
  keyword_count:     z.number().int().optional().nullable(),
  domain_authority:  z.number().int().min(0).max(100).optional().nullable(),
  backlinks_total:   z.number().int().optional().nullable(),
  paid_traffic:      z.number().int().optional().nullable(),
  ai_visibility:     z.number().optional().nullable(),
  recommendations:   z.array(z.any()).optional(),
  metadata:          z.record(z.any()).optional(),
});

export const { list, create, getById, update, remove } = createCrudController({
  table: 'performance_snapshots',
  createSchema,
  orderBy: 'snapshot_date',
});
