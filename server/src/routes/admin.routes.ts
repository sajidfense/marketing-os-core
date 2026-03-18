import { Router } from 'express';
import { adminMagicLogin } from '../controllers/admin.controller';
import { adminMiddleware } from '../middleware/admin.middleware';
import {
  adminCreateOrganization,
  adminCreateUser,
  adminAssignUserToOrg,
  adminProvisionClient,
} from '../controllers/admin-provisioning.controller';

export const adminRouter = Router();

// POST /api/admin/magic-login — no auth required, secret-gated
adminRouter.post('/magic-login', adminMagicLogin);

// ── Admin provisioning routes (protected by adminMiddleware) ──────
adminRouter.post('/create-organization', adminMiddleware, adminCreateOrganization);
adminRouter.post('/create-user', adminMiddleware, adminCreateUser);
adminRouter.post('/assign-user-to-organization', adminMiddleware, adminAssignUserToOrg);
adminRouter.post('/provision-client', adminMiddleware, adminProvisionClient);
