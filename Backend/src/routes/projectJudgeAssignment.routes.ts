import { Router } from 'express';
import {
  autoAssign,
  listMyProjectJudgeAssignments,
  listProjectJudgeAssignments,
  manualAssign,
  removeProjectJudgeAssignment,
} from '../controllers/projectJudgeAssignment.controller';
import { requireAuth } from '../middlewares/auth';
import { loadAdminScope, requireGlobalAdmin } from '../middlewares/adminScope';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/mine', requireAuth, requireRole('judge'), asyncHandler(listMyProjectJudgeAssignments));
router.get(
  '/',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(listProjectJudgeAssignments)
);
router.post(
  '/auto-assign',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(autoAssign)
);
router.post(
  '/manual-assign',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(manualAssign)
);
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(removeProjectJudgeAssignment)
);
export default router;
