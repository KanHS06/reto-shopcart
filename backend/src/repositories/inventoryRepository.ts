import mssql from 'mssql';
import { dbPool } from '../config/db.js';

export const inventoryRepository = {
  async getVariantesByProduct(productId: number) {
    const result = await dbPool.request()
      .input('ProductID', mssql.Int, productId)
      .execute('SP_Variantes_ObtenerPorProducto');
    return result.recordset;
  },

  async registrarMovimiento(
    idVariante: number, 
    tipoMovimiento: string, 
    cantidad: number, 
    motivo: string, 
    idUsuario: number
  ) {
    try {
      await dbPool.request()
        .input('IDVariante', mssql.Int, idVariante)
        .input('TipoMovimiento', mssql.VarChar(50), tipoMovimiento)
        .input('Cantidad', mssql.Int, cantidad)
        .input('Motivo', mssql.NVarChar(255), motivo)
        .input('IDUsuario', mssql.Int, idUsuario)
        .execute('SP_Kardex_RegistrarMovimiento');
      
      return { success: true, message: 'Movimiento registrado correctamente.' };
    } catch (error: any) {
      throw new Error(error.message || 'Error al registrar el movimiento en el inventario.');
    }
  }
};