import { Router } from 'express';
import { handleGenerateSkill, handleGetHistory } from '../controllers/skills.controller';
import { userDailyCapMiddleware, orgMonthlyTokenCapMiddleware } from '../middleware/rateLimit.middleware';

export const skillsRouter = Router();

skillsRouter.post(
  '/:skillType',
  userDailyCapMiddleware,
  orgMonthlyTokenCapMiddleware,
  handleGenerateSkill
);

skillsRouter.get('/history', handleGetHistory);
