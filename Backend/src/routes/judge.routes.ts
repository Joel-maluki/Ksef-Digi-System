import { Router } from 'express';
import {
  createJudge,
  deleteJudge,
  getJudge,
  listJudges,
  resetJudgeCredentials,
  updateJudge,
} from '../controllers/judge.controller';
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
  requireGlobalAdmin,
  asyncHandler(listJudges)
);
router.get(
  '/:id',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(getJudge)
);
router.post(
  '/',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(createJudge)
);
router.post(
  '/:id/reset-credentials',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(resetJudgeCredentials)
);
router.patch(
  '/:id',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(updateJudge)
);
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(deleteJudge)
);
export default router;
