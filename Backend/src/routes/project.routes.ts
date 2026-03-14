import { Router } from 'express';
import {
  createProject,
  deleteProject,
  getProject,
  getProjectRankingSummary,
  listProjectMentorCandidates,
  listProjects,
  promoteProject,
  reopenProjectScoring,
  updateProject,
} from '../controllers/project.controller';
import { requireAuth } from '../middlewares/auth';
import { loadAdminScope } from '../middlewares/adminScope';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get(
  '/',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin', 'patron'),
  asyncHandler(listProjects)
);
router.get(
  '/mentor-candidates',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  asyncHandler(listProjectMentorCandidates)
);
router.get(
  '/:id',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin', 'patron'),
  asyncHandler(getProject)
);
router.post('/', requireAuth, requireRole('patron'), asyncHandler(createProject));
router.patch(
  '/:id',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin', 'patron'),
  asyncHandler(updateProject)
);
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin', 'patron'),
  asyncHandler(deleteProject)
);
router.post(
  '/:id/promote',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  asyncHandler(promoteProject)
);
router.post(
  '/:id/reopen-scoring',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  asyncHandler(reopenProjectScoring)
);
router.get(
  '/:id/ranking-summary',
  requireAuth,
  asyncHandler(loadAdminScope),
  asyncHandler(getProjectRankingSummary)
);
export default router;
