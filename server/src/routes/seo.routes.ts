import { Router } from 'express';
import { analyseUrl } from '../controllers/seo.controller';

export const seoRouter = Router();

seoRouter.post('/analyse', analyseUrl);
