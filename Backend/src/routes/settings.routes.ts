import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), asyncHandler(getSettings));
router.patch('/', requireAuth, requireRole('admin'), asyncHandler(updateSettings));

export default router;
