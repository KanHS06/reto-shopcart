import type { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventoryService.js';

export const inventoryController = {
  async getVariantes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = Number(req.params.productId);
      const variantes = await inventoryService.obtenerVariantes(productId);
      res.status(200).json({ status: 'success', data: variantes });
    } catch (error) {
      next(error);
    }
  },

  async registrarMovimiento(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idVariante, tipoMovimiento, cantidad, motivo } = req.body;
      // id del usuario autenticado en req.user (gracias al token JWT)
      const idUsuario = (req as any).user?.id || 1; 

      const resultado = await inventoryService.registrarMovimientoInventario(
        Number(idVariante),
        tipoMovimiento,
        Number(cantidad),
        motivo,
        Number(idUsuario)
      );

      res.status(200).json({ status: 'success', message: resultado.message });
    } catch (error: any) {
      // Devolvemos el mensaje claro y amigable al cliente
      res.status(400).json({ status: 'error', message: error.message });
    }
  }
};