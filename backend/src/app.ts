import express, { type Application } from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler.js';
import { productRouter } from './controllers/productController.js';
import { orderRouter } from './controllers/orderController.js';
import { authRouter } from './controllers/authController.js';

const app: Application = express();

app.use(cors());
app.use(express.json());

// Ruta de salud de la API
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running smoothly' });
});

// Enrutadores de la API
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);

// El errorHandler SIEMPRE al final
app.use(errorHandler);

export default app;