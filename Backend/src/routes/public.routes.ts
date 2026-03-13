import { Router } from 'express';
import {
  publicAnnouncements,
  publicCategoryResults,
  publicRankings,
  publicResults,
  publicScores,
  publicSummary,
} from '../controllers/public.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/summary', asyncHandler(publicSummary));
router.get('/rankings', asyncHandler(publicRankings));
router.get('/scores', asyncHandler(publicScores));
router.get('/announcements', asyncHandler(publicAnnouncements));
router.get('/results', asyncHandler(publicResults));
router.get('/categories/:id/results', asyncHandler(publicCategoryResults));
export default router;
