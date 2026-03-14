import { Router } from 'express';
import { createJudgeCategoryAssignment, deleteJudgeCategoryAssignment, listJudgeCategoryAssignments } from '../controllers/judgeCategoryAssignment.controller';
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
  asyncHandler(listJudgeCategoryAssignments)
);
router.post(
  '/',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(createJudgeCategoryAssignment)
);
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(deleteJudgeCategoryAssignment)
);
export default router;
