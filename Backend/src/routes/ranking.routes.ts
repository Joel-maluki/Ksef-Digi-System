import { Router } from 'express';
import { listRankings } from '../controllers/ranking.controller';
import {
  hideCategoryResults,
  publishCategoryResults,
} from '../controllers/publication.controller';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), asyncHandler(listRankings));
router.post(
  '/publish',
  requireAuth,
  requireRole('admin'),
  asyncHandler(publishCategoryResults)
);
router.post(
  '/hide',
  requireAuth,
  requireRole('admin'),
  asyncHandler(hideCategoryResults)
);

export default router;
