import { Router } from 'express';
import { createSchool, deleteSchool, getSchool, listSchools, updateSchool } from '../controllers/school.controller';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/', requireAuth, asyncHandler(listSchools));
router.get('/:id', requireAuth, asyncHandler(getSchool));
router.post('/', requireAuth, requireRole('admin'), asyncHandler(createSchool));
router.patch('/:id', requireAuth, requireRole('admin'), asyncHandler(updateSchool));
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(deleteSchool));
export default router;
