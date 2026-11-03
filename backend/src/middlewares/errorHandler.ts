import { type Request, type Response, type NextFunction } from 'express';
import { CustomError } from './customError.js';

export const errorHandler = (
  err: any, // Cambiado a any temporalmente para leer propiedades ocultas de SQL
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof CustomError) {
    res.status(err.statusCode).json({ status: 'error', message: err.message });
    return;
  }

  // 🔥 MEJORA DE DIAGNÓSTICO: Imprime TODO el objeto que envía SQL Server
  console.error('ERROR DETALLADO EN EL SERVIDOR:', err);
  
  res.status(500).json({
    status: 'error',
    message: err.message || 'Ocurrió un error inesperado en el servidor.',
    sqlErrorNumber: err.number || null // Esto te dirá el número de error exacto de SQL Server
  });
};