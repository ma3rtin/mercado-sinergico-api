import { envs } from '../config/envs.js';
import jwt from 'jsonwebtoken';

export interface DatosEncriptados {
    id: number;
    email: string;
    rol: string;
}

const JWT_EXPIRES_IN = '2h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export async function crearToken(user: DatosEncriptados): Promise<string> {
  return jwt.sign(user, envs.JWT_SECRET_KEY, { expiresIn: JWT_EXPIRES_IN });
}

export async function crearRefreshToken(user: { id: number }): Promise<string> {
  return jwt.sign(user, envs.JWT_SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export async function decodificarToken(token: string): Promise<DatosEncriptados> {
  return jwt.verify(token, envs.JWT_SECRET_KEY) as DatosEncriptados;
}

export async function verificarRefreshToken(token: string): Promise<{ id: number }> {
  return jwt.verify(token, envs.JWT_SECRET_KEY) as { id: number };
}