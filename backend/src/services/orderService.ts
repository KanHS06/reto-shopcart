import { orderRepository, type ICartItem } from '../repositories/orderRepository.js';
import { CustomError } from '../middlewares/customError.js';

export const orderService = {
  /**
   * Valida la lógica de negocio del carrito de compras y delega la creación de la orden.
   */
  async processCheckout(userId: number, items: ICartItem[], couponCode: string | null): Promise<{ orderId: number; message: string }> {
    if (!items || items.length === 0) {
      throw new CustomError('El carrito de compras no contiene productos.', 400);
    }

    try {
      // Pasamos el código de cupón al repositorio (actualiza también la llamada en orderRepository enviando el parámetro)
      const orderId = await orderRepository.createOrder(userId, items, couponCode);
      
      return {
        orderId,
        message: '¡Orden de compra procesada con éxito!',
      };
    } catch (error: any) {
      if (error.message && error.message.includes('COUPON_INVALID')) {
        throw new CustomError('El cupón de descuento ingresado no es válido o ya ha expirado.', 400);
      }
      if (error.message && error.message.includes('STOCK_INSUFFICIENT')) {
        throw new CustomError('Uno o más productos seleccionados ya no cuentan con stock suficiente.', 409);
      }
      throw error;
    }
  },

  async getOrdersByUser(userId: number) {
    return await orderRepository.getOrdersByUser(userId);
  },
};
