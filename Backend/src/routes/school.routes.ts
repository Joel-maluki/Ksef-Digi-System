import { Router } from 'express';
import { createSchool, deleteSchool, getSchool, listSchools, updateSchool } from '../controllers/school.controller';
import { requireAuth } from '../middlewares/auth';
import { loadAdminScope, requireGlobalAdmin } from '../middlewares/adminScope';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/', requireAuth, asyncHandler(loadAdminScope), asyncHandler(listSchools));
router.get('/:id', requireAuth, asyncHandler(loadAdminScope), asyncHandler(getSchool));
router.post(
  '/',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(createSchool)
);
router.patch(
  '/:id',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(updateSchool)
);
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(deleteSchool)
);
export default router;
