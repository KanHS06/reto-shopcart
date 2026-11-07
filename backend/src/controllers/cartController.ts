import type { Request, Response, NextFunction } from 'express';
import { cartService } from '../services/cartService.js';

export const cartController = {
  // GET /api/cart
  async obtenerCarrito(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idUsuario = req.query.userId ? Number(req.query.userId) : undefined;
      const guestToken = req.query.guestToken ? String(req.query.guestToken) : undefined;

      const items = await cartService.obtenerContenidoCarrito(idUsuario, guestToken);
      res.status(200).json({ status: 'success', data: items });
    } catch (error: any) {
      console.error("DETALLE DEL ERROR EN CARRITO:", error);
      res.status(400).json({ status: 'error', message: error.message });
    }
  },

  // POST /api/cart/items
  async agregarItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extraemos userId, guestToken, idVariante y quantity del body enviado por el frontend
      const { userId, guestToken, idVariante, quantity } = req.body;
      
      const finalUserId = userId ? Number(userId) : 1; // Por defecto usamos 1 para pruebas si no viene

      const resultado = await cartService.agregarProductoAlCarrito(
        finalUserId,
        guestToken ? String(guestToken) : undefined,
        Number(idVariante),
        quantity ? Number(quantity) : 1
      );

      res.status(200).json({ status: 'success', message: resultado.message });
    } catch (error: any) {
      console.error("DETALLE DEL ERROR AL AGREGAR:", error);
      res.status(400).json({ status: 'error', message: error.message });
    }
  },

  // PUT /api/cart/items/:idItem
  async actualizarCantidad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idItem } = req.params;
      const { quantity } = req.body;

      const resultado = await cartService.actualizarCantidad(Number(idItem), Number(quantity));
      res.status(200).json({ status: 'success', message: resultado.message });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  },

  // DELETE /api/cart/items/:idItem
  async eliminarItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idItem } = req.params;

      const resultado = await cartService.eliminarItem(Number(idItem));
      res.status(200).json({ status: 'success', message: resultado.message });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }
};