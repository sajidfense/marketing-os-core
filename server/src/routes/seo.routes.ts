import { Router } from 'express';
import { analyseUrl, analyzePageSEO, generateSEOReport } from '../controllers/seo.controller';

export const seoRouter = Router();

seoRouter.post('/analyse', analyseUrl);
seoRouter.post('/analyze', analyzePageSEO);
seoRouter.post('/report', generateSEOReport);
