import express, { type Application } from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler.js'; // manejador

const app: Application = express();

// Middlewares globales básicos
app.use(cors());
app.use(express.json());

// Ruta de salud de la API
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running smoothly' });
});

app.use(errorHandler);

export default app;