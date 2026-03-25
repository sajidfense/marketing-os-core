import { Router } from 'express';
import { list, create, getById, update, remove } from '../controllers/strategies.controller';
import { asyncHandler } from '../lib/asyncHandler';

export const strategiesRouter = Router();

strategiesRouter.get('/',      asyncHandler(list));
strategiesRouter.post('/',     asyncHandler(create));
strategiesRouter.get('/:id',   asyncHandler(getById));
strategiesRouter.patch('/:id', asyncHandler(update));
strategiesRouter.delete('/:id', asyncHandler(remove));
