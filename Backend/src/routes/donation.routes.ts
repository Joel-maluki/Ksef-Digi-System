import { Router } from 'express';
import { getDonation, initiateDonation, listDonations, updateDonationStatus } from '../controllers/donation.controller';
import { requireAuth } from '../middlewares/auth';
import { loadAdminScope, requireGlobalAdmin } from '../middlewares/adminScope';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.post('/initiate', asyncHandler(initiateDonation));
router.get(
  '/',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(listDonations)
);
router.get(
  '/:id',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(getDonation)
);
router.patch(
  '/:id/status',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(updateDonationStatus)
);
export default router;
