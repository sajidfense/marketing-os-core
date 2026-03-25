import { Router } from 'express';
import { list, create, getById, update, remove } from '../controllers/roadmap.controller';
import { asyncHandler } from '../lib/asyncHandler';

export const roadmapRouter = Router();

roadmapRouter.get('/',      asyncHandler(list));
roadmapRouter.post('/',     asyncHandler(create));
roadmapRouter.get('/:id',   asyncHandler(getById));
roadmapRouter.patch('/:id', asyncHandler(update));
roadmapRouter.delete('/:id', asyncHandler(remove));
