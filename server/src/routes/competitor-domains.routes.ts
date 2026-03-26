import { Router } from 'express';
import { list, create, getById, update, remove } from '../controllers/competitor-domains.controller';
import { asyncHandler } from '../lib/asyncHandler';

export const competitorDomainsRouter = Router();

competitorDomainsRouter.get('/',      asyncHandler(list));
competitorDomainsRouter.post('/',     asyncHandler(create));
competitorDomainsRouter.get('/:id',   asyncHandler(getById));
competitorDomainsRouter.patch('/:id', asyncHandler(update));
competitorDomainsRouter.delete('/:id', asyncHandler(remove));
