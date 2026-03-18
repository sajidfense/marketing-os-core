import { Router } from 'express';
import { getOnboardingStatus, createOrganization } from '../controllers/onboarding.controller';

export const onboardingRouter = Router();

onboardingRouter.get('/status', getOnboardingStatus);
onboardingRouter.post('/organization', createOrganization);
