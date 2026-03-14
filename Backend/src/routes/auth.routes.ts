import { Router } from 'express';
import {
  forgotPassword,
  login,
  me,
  registerAdmin,
  registerJudge,
  registerPatron,
  registerSchool,
  setPassword,
} from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth';
import { loadAdminScope, requireGlobalAdmin } from '../middlewares/adminScope';
import { requireRole } from '../middlewares/roles';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * LOGIN
 */
router.post('/login', asyncHandler(login));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/register-school', asyncHandler(registerSchool));

/**
 * BOOTSTRAP ADMIN
 * Used only if no admin exists yet
 */
router.post('/bootstrap-admin', asyncHandler(registerAdmin));

/**
 * ADMIN ONLY ROUTES
 */
router.post(
  '/register-admin',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(registerAdmin)
);
router.post(
  '/register-patron',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(registerPatron)
);
router.post(
  '/register-judge',
  requireAuth,
  asyncHandler(loadAdminScope),
  requireRole('admin'),
  requireGlobalAdmin,
  asyncHandler(registerJudge)
);
router.post('/set-password', requireAuth, asyncHandler(setPassword));

router.get('/me', requireAuth, asyncHandler(me));

export default router;
