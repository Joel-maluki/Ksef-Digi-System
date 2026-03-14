import { Router } from 'express';
import {
  getScoresByJudge,
  getScoresByProject,
  listScores,
  relockScore,
  submitScore,
  unlockScore,
} from '../controllers/score.controller';
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
  asyncHandler(listScores)
);
router.get('/project/:projectId', requireAuth, asyncHandler(getScoresByProject));
router.get('/judge/:judgeId', requireAuth, asyncHandler(getScoresByJudge));
router.post('/', requireAuth, requireRole('judge'), asyncHandler(submitScore));
router.post(
  '/:id/unlock',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(unlockScore)
);
router.patch(
  '/:id/unlock',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(unlockScore)
);
router.patch(
  '/:id/relock',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(relockScore)
);
export default router;
