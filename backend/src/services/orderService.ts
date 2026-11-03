import { orderRepository, type ICartItem } from '../repositories/orderRepository.js';
import { CustomError } from '../middlewares/customError.js';

export const orderService = {
  /**
   * Valida la lógica de negocio del carrito de compras y delega la creación de la orden.
   */
  async processCheckout(userId: number, items: ICartItem[]): Promise<{ orderId: number; message: string }> {
    // Verificar un carrito vacio
    if (!items || items.length === 0) {
      throw new CustomError('El carrito de compras no contiene productos para procesar.', 400);
    }

    // Verificar que las cantidades de los productos sean válidas
    for (const item of items) {
      if (item.qty <= 0) {
        throw new CustomError(`La cantidad para el producto con ID ${item.id} debe ser mayor a cero.`, 400);
      }
    }

    try {
      // Delegar la transacción al repositorio de la base de datos
      const orderId = await orderRepository.createOrder(userId, items);
      
      return {
        orderId,
        message: '¡Orden de compra procesada con éxito!',
      };
    } catch (error: any) {
      // Capturar el error controlado que lanzamos en el Stored Procedure
      if (error.message && error.message.includes('STOCK_INSUFFICIENT')) {
        throw new CustomError('Uno o más productos seleccionados ya no cuentan con stock suficiente en nuestro inventario.', 409); // 409: Conflict
      }
      
      // Si es otro error de base de datos no mapeado, lo propagamos para que lo atrape el errorHandler global
      throw error;
    }
  },
};
