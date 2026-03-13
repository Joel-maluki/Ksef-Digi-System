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
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/', requireAuth, requireRole('admin'), asyncHandler(listScores));
router.get('/project/:projectId', requireAuth, asyncHandler(getScoresByProject));
router.get('/judge/:judgeId', requireAuth, asyncHandler(getScoresByJudge));
router.post('/', requireAuth, requireRole('judge'), asyncHandler(submitScore));
router.post('/:id/unlock', requireAuth, requireRole('admin'), asyncHandler(unlockScore));
router.patch('/:id/unlock', requireAuth, requireRole('admin'), asyncHandler(unlockScore));
router.patch('/:id/relock', requireAuth, requireRole('admin'), asyncHandler(relockScore));
export default router;
