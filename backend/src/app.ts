import express, { type Application } from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler.js';
import { productRouter } from './controllers/productController.js';
import { orderRouter } from './controllers/orderController.js';
import { authRouter } from './controllers/authController.js';
import { adminRouter } from './controllers/adminRoutes.js';

const app: Application = express();

app.use(cors({
  origin: 'http://localhost:5173', // Permite explícitamente a tu frontend
  credentials: true                // Permite el intercambio de cookies/tokens mediante headers
}));
app.use(express.json());

// Ruta de salud de la API
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running smoothly' });
});

// Enrutadores de la API
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api', adminRouter);


// El errorHandler SIEMPRE al final
app.use(errorHandler);

export default app;