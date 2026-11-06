import { Router } from 'express';
import { inventoryController } from '../controllers/inventoryController.js';

const router = Router();

// Endpoints para gestión de variantes y Kardex (RF-03)
router.get('/products/:productId/variants', inventoryController.getVariantes);
router.post('/inventory/movement', inventoryController.registrarMovimiento);

export default router;