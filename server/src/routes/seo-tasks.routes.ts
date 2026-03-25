import { Router } from 'express';
import { list, create, getById, update, remove } from '../controllers/seo-tasks.controller';
import { asyncHandler } from '../lib/asyncHandler';

export const seoTasksRouter = Router();

seoTasksRouter.get('/',      asyncHandler(list));
seoTasksRouter.post('/',     asyncHandler(create));
seoTasksRouter.get('/:id',   asyncHandler(getById));
seoTasksRouter.patch('/:id', asyncHandler(update));
seoTasksRouter.delete('/:id', asyncHandler(remove));
