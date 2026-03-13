import { Router } from 'express';
import {
  competitionMetricsReport,
  categoryReport,
  dashboardSummary,
  participationReport,
  projectsPerCategory,
  projectsPerCounty,
  projectsPerRegion,
  regionReport,
  studentsByGender,
} from '../controllers/report.controller';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get('/dashboard-summary', requireAuth, requireRole('admin'), asyncHandler(dashboardSummary));
router.get('/participation', requireAuth, requireRole('admin'), asyncHandler(participationReport));
router.get('/categories', requireAuth, requireRole('admin'), asyncHandler(categoryReport));
router.get('/regions', requireAuth, requireRole('admin'), asyncHandler(regionReport));
router.get(
  '/competition-metrics',
  requireAuth,
  requireRole('admin'),
  asyncHandler(competitionMetricsReport)
);
router.get('/projects-per-category', requireAuth, requireRole('admin'), asyncHandler(projectsPerCategory));
router.get('/projects-per-county', requireAuth, requireRole('admin'), asyncHandler(projectsPerCounty));
router.get('/projects-per-region', requireAuth, requireRole('admin'), asyncHandler(projectsPerRegion));
router.get('/students-by-gender', requireAuth, requireRole('admin'), asyncHandler(studentsByGender));
export default router;
