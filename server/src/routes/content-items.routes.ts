import { Router } from 'express';
import { list, create, getById, update, remove } from '../controllers/content-items.controller';
import { asyncHandler } from '../lib/asyncHandler';

export const contentItemsRouter = Router();

contentItemsRouter.get('/',      asyncHandler(list));
contentItemsRouter.post('/',     asyncHandler(create));
contentItemsRouter.get('/:id',   asyncHandler(getById));
contentItemsRouter.patch('/:id', asyncHandler(update));
contentItemsRouter.delete('/:id', asyncHandler(remove));
