import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomError } from './customError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export interface IAuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    name: string;
  };
}

export const requireAuth = (req: IAuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  // 1. Si no viene la cabecera, detenemos de inmediato la ejecución
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new CustomError('Acceso denegado. No se proporcionó un token de sesión.', 401);
  }

  // 2. Extraemos el string del token real de forma segura (añadiendo el)
  const token = authHeader.split(' ')[1];

  // 3. Validación adicional por seguridad estricta de TypeScript
  if (!token) {
    throw new CustomError('Formato de token inválido.', 401);
  }

  try {
    // 4. Verificamos el token sabiendo con 100% de certeza que es un string válido
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name
    };
    
    next();
  } catch (error) {
    throw new CustomError('Token de sesión inválido o expirado.', 403);
  }
};