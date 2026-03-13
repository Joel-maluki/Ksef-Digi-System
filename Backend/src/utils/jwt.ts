import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtPayload = {
  userId: string;
  role: 'admin' | 'patron' | 'judge';
  schoolId?: string;
};

export const signJwt = (payload: JwtPayload) => jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as any });

export const verifyJwt = (token: string) => jwt.verify(token, env.jwtSecret) as JwtPayload;
