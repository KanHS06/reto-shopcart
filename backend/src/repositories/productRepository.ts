import mssql from 'mssql';
import { dbPool } from '../config/db.js';

export interface IProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  created_at: Date;
  variants?: any[]; // <-- Arreglo opcional para las variantes
}

export const productRepository = {
  /**
   * Obtiene todos los productos disponibles en el catálogo.
   */
  async getCatalog(): Promise<IProduct[]> {
    const result = await dbPool.request().execute('SP_GetProductsCatalog');
    
    // Mapeamos los registros para convertir el string JSON de variantes en un array de objetos
    const products = result.recordset.map((record: any) => {
      let parsedVariants = [];
      if (record.variantsJson) {
        try {
          parsedVariants = JSON.parse(record.variantsJson);
        } catch (e) {
          parsedVariants = [];
        }
      }

      return {
        id: record.id,
        name: record.name,
        description: record.description,
        price: record.price,
        stock: record.stock,
        imageUrl: record.imageUrl,
        created_at: record.created_at,
        variants: parsedVariants // <-- Asignamos el arreglo ya parseado
      };
    });

    return products;
  },

  async create(product: Omit<IProduct, 'id' | 'created_at'>): Promise<number> {
    const request = dbPool.request();
    request.input('Name', mssql.VarChar(150), product.name);
    request.input('Description', mssql.Text, product.description);
    request.input('Price', mssql.Decimal(10, 2), product.price);
    request.input('Stock', mssql.Int, product.stock);
    request.input('ImageUrl', mssql.VarChar(255), product.imageUrl);
    request.output('GeneratedProductId', mssql.Int, null);

    const result = await request.execute('SP_AdminCreateProduct');
    return result.output.GeneratedProductId as number;
  },

  async update(id: number, product: Omit<IProduct, 'id' | 'created_at'>): Promise<boolean> {
    const result = await dbPool.request()
      .input('Id', mssql.Int, id)
      .input('Name', mssql.VarChar(150), product.name)
      .input('Description', mssql.Text, product.description)
      .input('Price', mssql.Decimal(10, 2), product.price)
      .input('Stock', mssql.Int, product.stock)
      .input('ImageUrl', mssql.VarChar(255), product.imageUrl)
      .execute('SP_AdminUpdateProduct');

    return result.recordset[0].RowsAffected > 0;
  },

  async delete(id: number): Promise<boolean> {
    const result = await dbPool.request()
      .input('Id', mssql.Int, id)
      .execute('SP_AdminDeleteProduct');

    return result.recordset[0].RowsAffected > 0;
  }  
};