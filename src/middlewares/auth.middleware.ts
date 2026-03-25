import { Request, Response, NextFunction } from 'express';
import { DatosEncriptados, decodificarToken } from '../auth/jwt.js';

declare global {
  namespace Express {
    interface Request {
      user?: DatosEncriptados;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authorization header missing or invalid' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const user = await decodificarToken(token);

    req.user = user;
    next();
  } catch (error: any) {
    console.error('❌ Token Verification Error:', error.message);
    const message = error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    res.status(401).json({ success: false, message });
  }
}

export function rolMiddleware(rolesPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!rolesPermitidos.includes(user.rol)) {
      res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
      return;
    }

    next();
  };
}

