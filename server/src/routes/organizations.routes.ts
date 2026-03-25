import { Router } from 'express';
import { getOrgSettings, updateBranding, getUsage, inviteMember } from '../controllers/organizations.controller';
import { asyncHandler } from '../lib/asyncHandler';

export const organizationsRouter = Router();

organizationsRouter.get('/settings',        asyncHandler(getOrgSettings));
organizationsRouter.patch('/branding',      asyncHandler(updateBranding));
organizationsRouter.get('/usage',           asyncHandler(getUsage));
organizationsRouter.post('/members/invite', asyncHandler(inviteMember));
