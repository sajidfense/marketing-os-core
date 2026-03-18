import { Router } from 'express';
import { handleGenerateSkill, handleGetHistory } from '../controllers/skills.controller';
import { userDailyCapMiddleware, orgMonthlyTokenCapMiddleware } from '../middleware/rateLimit.middleware';
import { creditsGuard } from '../middleware/credits.middleware';

export const skillsRouter = Router();

skillsRouter.post(
  '/:skillType',
  userDailyCapMiddleware,
  orgMonthlyTokenCapMiddleware,
  creditsGuard(),  // reads skillType from req.params.skillType
  handleGenerateSkill
);

skillsRouter.get('/history', handleGetHistory);
