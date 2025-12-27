import { Request, Response, NextFunction } from 'express';
import { auth } from '../auth/firebase-admin.js';
import { CustomError } from '../errors/custom.error.js';

export interface FirebaseUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

export interface FirebaseAuthenticatedRequest extends Request {
  firebaseUser?: FirebaseUser;
}

export const firebaseAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Token de autorización requerido', 401);
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verificar el token con Firebase Admin
    const decodedToken = await auth.verifyIdToken(token);
    
    // Extraer información del usuario
    const user: FirebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    // Agregar el usuario al request
    (req as FirebaseAuthenticatedRequest).firebaseUser = user;
    
    next();
  } catch (error) {
    console.error('Error en autenticación Firebase:', error);
    
    if (error instanceof CustomError) {
      return res.status(error.status).json({ error: error.message });
    }
    
    return res.status(401).json({ 
      error: 'Token inválido o expirado' 
    });
  }
};
