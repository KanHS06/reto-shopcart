import { Router } from 'express';
import { cartController } from '../controllers/cartController.js';

const router = Router();

router.get('/cart', cartController.obtenerCarrito);
router.post('/cart/items', cartController.agregarItem);
router.put('/cart/items/:idItem', cartController.actualizarCantidad);
router.delete('/cart/items/:idItem', cartController.eliminarItem);

export default router;