import { Router } from 'express';
import { generateBoardReport, exportPdf, listReports } from '../controllers/reports.controller';
import { asyncHandler } from '../lib/asyncHandler';

export const reportsRouter = Router();

reportsRouter.get('/',           asyncHandler(listReports));
reportsRouter.post('/',          asyncHandler(generateBoardReport));
reportsRouter.post('/export',    asyncHandler(exportPdf));
