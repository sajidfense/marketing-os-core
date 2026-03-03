import { Router } from 'express';
import { list, create, getById, update, remove } from '../controllers/workflows.controller';

export const workflowsRouter = Router();

workflowsRouter.get('/',      list);
workflowsRouter.post('/',     create);
workflowsRouter.get('/:id',   getById);
workflowsRouter.patch('/:id', update);
workflowsRouter.delete('/:id', remove);
