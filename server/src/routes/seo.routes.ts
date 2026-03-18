import { Router } from 'express';
import { analyseUrl, analyzePageSEO, generateSEOReport } from '../controllers/seo.controller';
import { creditsGuard } from '../middleware/credits.middleware';

export const seoRouter = Router();

seoRouter.post('/analyse', creditsGuard('seo-analysis'), analyseUrl);
seoRouter.post('/analyze', creditsGuard('seo-analysis'), analyzePageSEO);
seoRouter.post('/report', creditsGuard('seo-report'), generateSEOReport);
