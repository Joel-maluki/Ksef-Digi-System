import { Router } from 'express';
import { getDonation, initiateDonation, listDonations, updateDonationStatus } from '../controllers/donation.controller';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.post('/initiate', asyncHandler(initiateDonation));
router.get('/', requireAuth, requireRole('admin'), asyncHandler(listDonations));
router.get('/:id', requireAuth, requireRole('admin'), asyncHandler(getDonation));
router.patch('/:id/status', requireAuth, requireRole('admin'), asyncHandler(updateDonationStatus));
export default router;
