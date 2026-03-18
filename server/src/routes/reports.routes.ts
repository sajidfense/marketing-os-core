import { Router } from 'express';
import { generateBoardReport, exportPdf, listReports } from '../controllers/reports.controller';

export const reportsRouter = Router();

reportsRouter.post('/generate-board-report', generateBoardReport);
reportsRouter.post('/export-pdf',            exportPdf);
reportsRouter.get('/',                       listReports);
