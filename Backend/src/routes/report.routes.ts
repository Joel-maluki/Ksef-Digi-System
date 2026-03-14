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
import { loadAdminScope, requireGlobalAdmin } from '../middlewares/adminScope';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.get(
  '/dashboard-summary',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(dashboardSummary)
);
router.get(
  '/participation',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(participationReport)
);
router.get(
  '/categories',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(categoryReport)
);
router.get(
  '/regions',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(regionReport)
);
router.get(
  '/competition-metrics',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(competitionMetricsReport)
);
router.get(
  '/projects-per-category',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(projectsPerCategory)
);
router.get(
  '/projects-per-county',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(projectsPerCounty)
);
router.get(
  '/projects-per-region',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(projectsPerRegion)
);
router.get(
  '/students-by-gender',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(studentsByGender)
);
export default router;
