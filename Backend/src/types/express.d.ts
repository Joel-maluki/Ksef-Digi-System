import { JwtPayload } from '../utils/jwt';
import { AdminScopeContext } from '../services/adminScope.service';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      adminScope?: AdminScopeContext;
    }
  }
}

export {};
