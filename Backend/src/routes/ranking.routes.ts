import { Router } from 'express';
import { listRankings } from '../controllers/ranking.controller';
import {
  hideCategoryResults,
  publishCategoryResults,
} from '../controllers/publication.controller';
import { requireAuth } from '../middlewares/auth';
import { loadAdminScope } from '../middlewares/adminScope';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  asyncHandler(listRankings)
);
router.post(
  '/publish',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  asyncHandler(publishCategoryResults)
);
router.post(
  '/hide',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  asyncHandler(hideCategoryResults)
);

export default router;
