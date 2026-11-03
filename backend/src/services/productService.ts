import { productRepository, type IProduct } from '../repositories/productRepository.js';
import { CustomError } from '../middlewares/customError.js';

export const productService = {
  /**
   * Recupera el catálogo completo de productos disponibles.
   */
  async getCatalog(): Promise<IProduct[]> {
    return await productRepository.getCatalog();
  },

  /**
   * Crea un nuevo producto en el catálogo.
   */
  async createProduct(product: Omit<IProduct, 'id' | 'created_at'>) {
    if (product.price < 0 || product.stock < 0) {
      throw new CustomError('El precio y el stock no pueden ser valores negativos.', 400);
    }
    const productId = await productRepository.create(product);
    return { productId, message: 'Producto creado exitosamente.' };
  },

  /**
   * Actualiza un producto existente en el catálogo.
   */
  async updateProduct(id: number, product: Omit<IProduct, 'id' | 'created_at'>) {
    if (product.price < 0 || product.stock < 0) {
      throw new CustomError('El precio y el stock no pueden ser valores negativos.', 400);
    }
    const exists = await productRepository.update(id, product);
    if (!exists) {
      throw new CustomError('El producto que intenta actualizar no existe.', 404);
    }
    return { message: 'Producto actualizado con éxito.' };
  },

  /**
   * Elimina un producto del catálogo.
   */
  async deleteProduct(id: number) {
    try {
      const exists = await productRepository.delete(id);
      if (!exists) {
        throw new CustomError('El producto que intenta eliminar no existe.', 404);
      }
      return { message: 'Producto eliminado del catálogo.' };
    } catch (error: any) {
      // Código de error 547 en SQL Server representa violaciones de llaves foráneas
      if (error.number === 547) {
        throw new CustomError('No se puede eliminar el producto porque ya está asociado a órdenes de compra históricas.', 409);
      }
      throw error;
    }
  }
};