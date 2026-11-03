import mssql from 'mssql';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const dbConfig: mssql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true, // Requerido si usas Azure, recomendado siempre
    trustServerCertificate: true, // Necesario para entornos de desarrollo local
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Crear un pool global para reutilizarlo en los repositorios
export const dbPool = new mssql.ConnectionPool(dbConfig);

export const connectDB = async (): Promise<mssql.ConnectionPool> => {
  try {
    if (!dbPool.connected && !dbPool.connecting) {
      await dbPool.connect();
      console.log('Conexión exitosa a SQL Server establecida.');
    }
    return dbPool;
  } catch (error) {
    console.error('Error al conectar con SQL Server:', error);
    process.exit(1); // Detener la app si la base de datos falla
  }
};
