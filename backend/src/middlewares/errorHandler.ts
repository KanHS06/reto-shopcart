import { type Request, type Response, type NextFunction } from 'express';
import { CustomError } from './customError.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Si es un error controlado por nosotros
  if (err instanceof CustomError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Si ocurre un error inesperado (ej. error crítico interno de base de datos)
  console.error('Internal Server Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Ocurrió un error inesperado en el servidor.',
  });
};
