import { Router } from 'express';
import { list, create, getById, update, remove } from '../controllers/workflows.controller';
import { asyncHandler } from '../lib/asyncHandler';

export const workflowsRouter = Router();

workflowsRouter.get('/',      asyncHandler(list));
workflowsRouter.post('/',     asyncHandler(create));
workflowsRouter.get('/:id',   asyncHandler(getById));
workflowsRouter.patch('/:id', asyncHandler(update));
workflowsRouter.delete('/:id', asyncHandler(remove));
