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
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/', requireAuth, requireRole('admin'), asyncHandler(listJudges));
router.get('/:id', requireAuth, requireRole('admin'), asyncHandler(getJudge));
router.post('/', requireAuth, requireRole('admin'), asyncHandler(createJudge));
router.post(
  '/:id/reset-credentials',
  requireAuth,
  requireRole('admin'),
  asyncHandler(resetJudgeCredentials)
);
router.patch('/:id', requireAuth, requireRole('admin'), asyncHandler(updateJudge));
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(deleteJudge));
export default router;
