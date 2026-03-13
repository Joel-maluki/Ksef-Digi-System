import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyJwt } from '../utils/jwt';

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new ApiError(401, 'Missing or invalid authorization header'));
  const token = header.replace('Bearer ', '');
  req.user = verifyJwt(token);
  next();
};
