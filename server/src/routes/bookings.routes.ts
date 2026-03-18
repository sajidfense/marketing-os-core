import { Router } from 'express';
import { list, create, getById, update, remove } from '../controllers/bookings.controller';

export const bookingsRouter = Router();

bookingsRouter.get('/',      list);
bookingsRouter.post('/',     create);
bookingsRouter.get('/:id',   getById);
bookingsRouter.patch('/:id', update);
bookingsRouter.delete('/:id', remove);
