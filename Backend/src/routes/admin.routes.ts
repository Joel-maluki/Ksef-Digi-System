import { Router } from 'express';
import { dashboardStats } from '../controllers/admin.controller';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/dashboard-stats',
  requireAuth,
  requireRole('admin'),
  asyncHandler(dashboardStats)
);

export default router;
