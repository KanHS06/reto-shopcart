import { productRepository, type IProduct } from '../repositories/productRepository.js';

export const productService = {
  /**
   * Recupera el catálogo completo de productos disponibles.
   */
  async getCatalog(): Promise<IProduct[]> {
    // Lógica de negocio
    return await productRepository.getCatalog();
  },
};
