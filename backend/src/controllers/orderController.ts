import { type Response, type NextFunction, Router } from 'express';
import { orderService } from '../services/orderService.js';
import { requireAuth, type IAuthRequest } from '../middlewares/authMiddleware.js'; // Middleware importado

const router = Router();

// Agregamos `requireAuth` como interceptor previo en esta ruta
router.post('/checkout', requireAuth, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, couponCode } = req.body; // Recibe couponCode de forma opcional
    const realUserId = req.user!.userId;

    const result = await orderService.processCheckout(realUserId, items, couponCode || null);
    
    res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/my-orders - Listar el historial de compras del usuario autenticado
router.get('/my-orders', requireAuth, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const realUserId = req.user!.userId;
    const orders = await orderService.getOrdersByUser(realUserId); // Asegúrate de exponer este método en tu orderService
    
    res.status(200).json({
      status: 'success',
      data: orders,
    });
  } catch (error) {
    next(error);
  }
});

export const orderRouter = router;