import { Request, Response, NextFunction } from 'express';
import { DatosEncriptados, decodificarToken } from '../auth/jwt';

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
    console.log('🔎 Header recibido:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Token no proporcionado' });
      return;
    }

    const token = authHeader.split(' ')[1];
    console.log('🧩 Token a verificar:', token);
    const user = await decodificarToken(token);
    console.log('✅ Token decodificado:', user);


    req.user = user;

    next();
  } catch (error: any) {
    console.error('❌ Error al verificar token:', error.message);

    res.status(401).json({ message: 'Token inválido o expirado' });
    return;
  }
}

export function rolMiddleware(rolesPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    if (!rolesPermitidos.includes(user.rol)) {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }

    next();
  };
}