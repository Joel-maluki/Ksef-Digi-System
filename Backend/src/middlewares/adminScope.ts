import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { getAdminScopeContext } from '../services/adminScope.service';

export const loadAdminScope = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return next();
  }

  req.adminScope = await getAdminScopeContext(req.user.userId);
  return next();
};

export const requireGlobalAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'Forbidden'));
  }

  if (req.adminScope && !req.adminScope.isGlobal) {
    return next(
      new ApiError(
        403,
        'This action is not available for area-scoped admins yet'
      )
    );
  }

  return next();
};
