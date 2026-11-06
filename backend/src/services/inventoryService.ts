import { inventoryRepository } from '../repositories/inventoryRepository.js';

export const inventoryService = {
  async obtenerVariantes(productId: number) {
    return await inventoryRepository.getVariantesByProduct(productId);
  },

  async registrarMovimientoInventario(
    idVariante: number, 
    tipoMovimiento: string, 
    cantidad: number, 
    motivo: string, 
    idUsuario: number
  ) {
    if (!motivo || motivo.trim() === '') {
      throw new Error('El motivo del movimiento es obligatorio.');
    }
    return await inventoryRepository.registrarMovimiento(idVariante, tipoMovimiento, cantidad, motivo, idUsuario);
  }
};