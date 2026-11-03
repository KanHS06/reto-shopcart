import { type Request, type Response, type NextFunction, Router } from 'express';
import { authService } from '../services/authService.js';

const router = Router();

router.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    const result = await authService.register(email, password, name);
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

export const authRouter = router;