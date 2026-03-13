import { Router } from 'express';
import { createJudgeCategoryAssignment, deleteJudgeCategoryAssignment, listJudgeCategoryAssignments } from '../controllers/judgeCategoryAssignment.controller';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/', requireAuth, requireRole('admin'), asyncHandler(listJudgeCategoryAssignments));
router.post('/', requireAuth, requireRole('admin'), asyncHandler(createJudgeCategoryAssignment));
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(deleteJudgeCategoryAssignment));
export default router;
