import { envs } from '../config/envs';
import jwt from 'jsonwebtoken';

export interface DatosEncriptados {
    id: number;
    email: string;
    rol: string;
}

export async function crearToken(user: DatosEncriptados): Promise<string> {
  const secretKey = envs.JWT_SECRET_KEY;
  const token = jwt.sign(user, secretKey);
  console.log('🔐 CREAR JWT_SECRET_KEY:', envs.JWT_SECRET_KEY);
  return token;
}

export async function decodificarToken(token: string): Promise<DatosEncriptados> {
  const secretKey = envs.JWT_SECRET_KEY;
  const decodedToken = jwt.verify(token, secretKey) as DatosEncriptados;
  console.log('🔐 DECODIFICAR JWT_SECRET_KEY:', envs.JWT_SECRET_KEY);
  return decodedToken;
}