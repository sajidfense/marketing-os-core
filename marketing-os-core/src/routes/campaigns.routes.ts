import { Router } from 'express';
import { list, create, getById, update, remove } from '../controllers/campaigns.controller';

export const campaignsRouter = Router();

campaignsRouter.get('/',      list);
campaignsRouter.post('/',     create);
campaignsRouter.get('/:id',   getById);
campaignsRouter.patch('/:id', update);
campaignsRouter.delete('/:id', remove);
