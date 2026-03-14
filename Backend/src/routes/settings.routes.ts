import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { requireAuth } from '../middlewares/auth';
import { loadAdminScope, requireGlobalAdmin } from '../middlewares/adminScope';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  asyncHandler(getSettings)
);
router.patch(
  '/',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(updateSettings)
);

export default router;
