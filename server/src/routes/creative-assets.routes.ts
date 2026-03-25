import { Router } from 'express';
import { list, create, getById, update, remove } from '../controllers/creative-assets.controller';
import { asyncHandler } from '../lib/asyncHandler';

export const creativeAssetsRouter = Router();

creativeAssetsRouter.get('/',      asyncHandler(list));
creativeAssetsRouter.post('/',     asyncHandler(create));
creativeAssetsRouter.get('/:id',   asyncHandler(getById));
creativeAssetsRouter.patch('/:id', asyncHandler(update));
creativeAssetsRouter.delete('/:id', asyncHandler(remove));
