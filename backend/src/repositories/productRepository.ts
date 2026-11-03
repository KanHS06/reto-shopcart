import mssql from 'mssql';
import { dbPool } from '../config/db.js';

// Definimos la interfaz que representa la estructura de un producto en la BD
export interface IProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  created_at: Date;
}

export const productRepository = {
  /**
   * Obtiene todos los productos disponibles en el catálogo.
   */
  async getCatalog(): Promise<IProduct[]> {
    const result = await dbPool.request().execute('SP_GetProductsCatalog');
    return result.recordset as IProduct[];
  },
};