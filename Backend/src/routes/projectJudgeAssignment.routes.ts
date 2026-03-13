import { Router } from 'express';
import {
  autoAssign,
  listMyProjectJudgeAssignments,
  listProjectJudgeAssignments,
  manualAssign,
  removeProjectJudgeAssignment,
} from '../controllers/projectJudgeAssignment.controller';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/mine', requireAuth, requireRole('judge'), asyncHandler(listMyProjectJudgeAssignments));
router.get('/', requireAuth, requireRole('admin'), asyncHandler(listProjectJudgeAssignments));
router.post('/auto-assign', requireAuth, requireRole('admin'), asyncHandler(autoAssign));
router.post('/manual-assign', requireAuth, requireRole('admin'), asyncHandler(manualAssign));
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(removeProjectJudgeAssignment));
export default router;
