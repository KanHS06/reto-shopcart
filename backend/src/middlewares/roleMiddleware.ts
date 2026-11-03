import { type Response, type NextFunction } from 'express';
import { type IAuthRequest } from './authMiddleware.js';
import { CustomError } from './customError.js';

export const isAdmin = (req: IAuthRequest, res: Response, next: NextFunction): void => {
  // Verificamos si el middleware previo inyectó al usuario y si su correo es el del administrador
  if (!req.user || req.user.email !== 'admin@shop.com') {
    throw new CustomError('Acceso denegado. Se requieren permisos de administrador.', 403);
  }
  next();
};