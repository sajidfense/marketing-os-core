import { Router } from 'express';
import { getBranding, updateBranding } from '../controllers/branding.controller';

export const brandingRouter = Router();

brandingRouter.get('/',  getBranding);
brandingRouter.put('/',  updateBranding);
