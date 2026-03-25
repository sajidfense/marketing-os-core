import { Router } from 'express';
import { getBranding, updateBranding } from '../controllers/branding.controller';
import { asyncHandler } from '../lib/asyncHandler';

export const brandingRouter = Router();

brandingRouter.get('/',  asyncHandler(getBranding));
brandingRouter.put('/',  asyncHandler(updateBranding));
