import { Router } from 'express';
import { createAnnouncement, deleteAnnouncement, listAnnouncements, updateAnnouncement } from '../controllers/announcement.controller';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/', requireAuth, requireRole('admin'), asyncHandler(listAnnouncements));
router.post('/', requireAuth, requireRole('admin'), asyncHandler(createAnnouncement));
router.patch('/:id', requireAuth, requireRole('admin'), asyncHandler(updateAnnouncement));
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(deleteAnnouncement));
export default router;
