import { Router } from 'express';
import { adminController } from './adminController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/admin/users', requireAuth, adminController.getUsers);
router.get('/admin/coupons', requireAuth, adminController.getCoupons);
router.post('/admin/coupons', requireAuth, adminController.createCoupon);

export const adminRouter = router;