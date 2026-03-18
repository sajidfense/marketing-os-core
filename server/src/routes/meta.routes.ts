import { Router } from 'express';
import {
  startOAuth,
  handleCallback,
  listConnections,
  getOverview,
  removeConnection,
} from '../controllers/meta.controller';

export const metaRouter = Router();

metaRouter.get('/oauth/start',        startOAuth);
metaRouter.get('/oauth/callback',     handleCallback);
metaRouter.get('/connections',        listConnections);
metaRouter.get('/overview',           getOverview);
metaRouter.delete('/connections/:id', removeConnection);
