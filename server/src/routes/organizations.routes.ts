import { Router } from 'express';
import { getOrgSettings, updateBranding, getUsage, inviteMember } from '../controllers/organizations.controller';

export const organizationsRouter = Router();

organizationsRouter.get('/settings',        getOrgSettings);
organizationsRouter.patch('/branding',      updateBranding);
organizationsRouter.get('/usage',           getUsage);
organizationsRouter.post('/members/invite', inviteMember);
