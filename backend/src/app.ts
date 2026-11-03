import express, { type Application } from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler.js';
import { productRouter } from './controllers/productController.js'; // Productos
import { orderRouter } from './controllers/orderController.js';   // Órdenes

import { authRouter } from './controllers/authController.js';

const app: Application = express();

app.use('/api/auth', authRouter);
// Middlewares globales básicos
app.use(cors());
app.use(express.json());

// Ruta de salud de la API
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running smoothly' });
});

// REGISTRO DE RUTAS DE LA API
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);

app.use(errorHandler);

export default app;