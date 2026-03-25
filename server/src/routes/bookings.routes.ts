import { Router } from 'express';
import { list, create, getById, update, remove } from '../controllers/bookings.controller';
import { asyncHandler } from '../lib/asyncHandler';

export const bookingsRouter = Router();

bookingsRouter.get('/',      asyncHandler(list));
bookingsRouter.post('/',     asyncHandler(create));
bookingsRouter.get('/:id',   asyncHandler(getById));
bookingsRouter.patch('/:id', asyncHandler(update));
bookingsRouter.delete('/:id', asyncHandler(remove));
