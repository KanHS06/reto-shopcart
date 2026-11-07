import { cartRepository } from '../repositories/cartRepository.js';

export const cartService = {
  // Agregar o incrementar ítem recibiendo los parámetros correctos
  async agregarProductoAlCarrito(userId?: number, guestToken?: string, idVariante?: number, quantity?: number) {
    return await cartRepository.agregarItem(userId, guestToken, idVariante, quantity);
  },

  // Obtener todos los ítems activos
  async obtenerContenidoCarrito(idUsuario?: number, guestToken?: string) {
    return await cartRepository.obtenerCarritoPorUsuario(idUsuario, guestToken);
  },

  // Actualizar la cantidad exacta de un ítem
  async actualizarCantidad(idItem: number, quantity: number) {
    return await cartRepository.actualizarCantidadItem(idItem, quantity);
  },

  // Eliminar un ítem del carrito
  async eliminarItem(idItem: number) {
    return await cartRepository.eliminarItemCarrito(idItem);
  }
};