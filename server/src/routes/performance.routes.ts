import { Router } from 'express';
import { list, create, getById, update, remove } from '../controllers/performance.controller';
import { asyncHandler } from '../lib/asyncHandler';

export const performanceRouter = Router();

performanceRouter.get('/',      asyncHandler(list));
performanceRouter.post('/',     asyncHandler(create));
performanceRouter.get('/:id',   asyncHandler(getById));
performanceRouter.patch('/:id', asyncHandler(update));
performanceRouter.delete('/:id', asyncHandler(remove));
