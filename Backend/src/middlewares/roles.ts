import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

export const requireRole = (...roles: Array<'admin' | 'patron' | 'judge'>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, 'Unauthorized'));
    if (!roles.includes(req.user.role)) return next(new ApiError(403, 'Forbidden'));
    next();
  };
