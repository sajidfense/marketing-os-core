import { Router } from 'express';
import { list, create, getById, update, remove } from '../controllers/campaigns.controller';
import { asyncHandler } from '../lib/asyncHandler';

export const campaignsRouter = Router();

campaignsRouter.get('/',      asyncHandler(list));
campaignsRouter.post('/',     asyncHandler(create));
campaignsRouter.get('/:id',   asyncHandler(getById));
campaignsRouter.patch('/:id', asyncHandler(update));
campaignsRouter.delete('/:id', asyncHandler(remove));
