import { Router } from 'express';
import {
  getOnboardingStatus,
  createOrganization,
  onboardingCreateCampaign,
  onboardingSetBranding,
  onboardingSaveGoals,
} from '../controllers/onboarding.controller';

// Pre-org routes (auth only, no org required)
export const onboardingRouter = Router();
onboardingRouter.get('/status', getOnboardingStatus);
onboardingRouter.post('/organization', createOrganization);

// Post-org routes (auth + org required) — mounted on authenticated API
export const onboardingStepsRouter = Router();
onboardingStepsRouter.post('/campaign', onboardingCreateCampaign);
onboardingStepsRouter.post('/branding', onboardingSetBranding);
onboardingStepsRouter.post('/goals', onboardingSaveGoals);
