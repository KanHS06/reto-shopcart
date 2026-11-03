import { type Request, type Response, type NextFunction, Router } from 'express';
import { productService } from '../services/productService.js';
import { requireAuth, type IAuthRequest } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';

const router = Router();

// Endpoint público: Cualquier usuario puede ver los productos
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const catalog = await productService.getCatalog();
    res.status(200).json({ status: 'success', data: catalog });
  } catch (error) {
    next(error);
  }
});

// Endpoints Administrativos: Requieren Token Válido Y ser Cuenta Administradora
router.post('/', requireAuth, isAdmin, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await productService.createProduct(req.body);
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, isAdmin, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await productService.updateProduct(Number(req.params.id), req.body);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, isAdmin, async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await productService.deleteProduct(Number(req.params.id));
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

export const productRouter = router;