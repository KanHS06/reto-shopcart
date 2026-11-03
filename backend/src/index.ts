import app from './app.js'; // Agregado ".js"
import { connectDB } from './config/db.js'; // Agregado ".js"
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Servidor backend escuchando en: http://localhost:${PORT}`);
    console.log(`Prueba el estado del servidor en: http://localhost:${PORT}/health`);
  });
};

startServer();