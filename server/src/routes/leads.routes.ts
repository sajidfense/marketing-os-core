import { Router } from 'express';
import { list, create, getById, update, remove } from '../controllers/leads.controller';
import { asyncHandler } from '../lib/asyncHandler';

export const leadsRouter = Router();

leadsRouter.get('/',      asyncHandler(list));
leadsRouter.post('/',     asyncHandler(create));
leadsRouter.get('/:id',   asyncHandler(getById));
leadsRouter.patch('/:id', asyncHandler(update));
leadsRouter.delete('/:id', asyncHandler(remove));
