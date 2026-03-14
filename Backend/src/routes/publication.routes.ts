import { Router } from 'express';
import {
  hideCategoryResults,
  publicationOverview,
  publishCategoryResults,
} from '../controllers/publication.controller';
import { requireAuth } from '../middlewares/auth';
import { loadAdminScope } from '../middlewares/adminScope';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get(
  '/overview',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  asyncHandler(publicationOverview)
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
