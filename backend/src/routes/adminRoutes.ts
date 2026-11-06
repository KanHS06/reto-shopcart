import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/admin/users', requireAuth, adminController.getUsers);
router.get('/admin/coupons', requireAuth, adminController.getCoupons);
router.post('/admin/coupons', requireAuth, adminController.createCoupon);
router.get('/admin/stats', requireAuth, adminController.getStats);

export const adminRouter = router;