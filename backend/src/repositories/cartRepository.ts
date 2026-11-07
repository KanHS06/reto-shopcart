import mssql from 'mssql';
import { dbPool } from '../config/db.js';

export const cartRepository = {
  // Ejecutar procedimiento almacenado para agregar o actualizar ítems
  async agregarItem(userId?: number, guestToken?: string, idVariante?: number, quantity?: number) {
    try {
      const request = dbPool.request();
      
      request.input('IDUsuario', mssql.Int, userId !== undefined ? userId : null);
      request.input('GuestToken', mssql.VarChar(255), guestToken !== undefined ? guestToken : null);
      request.input('IDVariante', mssql.Int, idVariante);
      request.input('Quantity', mssql.Int, quantity);

      await request.execute('SP_Carrito_AgregarItem');
      
      return { success: true, message: 'Producto agregado al carrito exitosamente.' };
    } catch (error: any) {
      console.error("Error en cartRepository.agregarItem:", error.message);
      throw new Error(error.message || 'Error al procesar la solicitud en el carrito.');
    }
  },

  // Consultar ítems del carrito mediante procedimiento almacenado
  async obtenerCarritoPorUsuario(idUsuario?: number, guestToken?: string) {
    try {
      const request = dbPool.request();
      
      // Definimos siempre ambos parámetros para que node-mssql no falle
      request.input('IDUsuario', mssql.Int, idUsuario !== undefined ? idUsuario : null);
      request.input('GuestToken', mssql.VarChar(255), guestToken !== undefined ? guestToken : null);

      const result = await request.execute('SP_Carrito_ObtenerPorUsuario');
      return result.recordset;
    } catch (error: any) {
      console.error("Error en cartRepository.obtenerCarritoPorUsuario:", error.message);
      throw new Error(error.message || 'Error al obtener el contenido del carrito.');
    }
  },

  async actualizarCantidadItem(idItem: number, quantity: number) {
    try {
      await dbPool.request()
        .input('IDItem', mssql.Int, idItem)
        .input('NewQuantity', mssql.Int, quantity)
        .execute('SP_Carrito_ActualizarCantidad');
      
      return { success: true, message: 'Cantidad actualizada correctamente.' };
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar la cantidad.');
    }
  },

  async eliminarItemCarrito(idItem: number) {
    try {
      await dbPool.request()
        .input('IDItem', mssql.Int, idItem)
        .execute('SP_Carrito_EliminarItem');
      
      return { success: true, message: 'Producto eliminado del carrito.' };
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar el producto del carrito.');
    }
  }
};