import mssql from 'mssql';
import { dbPool } from '../config/db.js';

export interface ICartItem {
  id: number;
  qty: number;
  price: number;
}

export const orderRepository = {
  /**
   * Procesa el checkout convirtiendo el carrito de compras a XML 
   * y ejecutando la transacción atómica en SQL Server con cupón opcional.
   */
  async createOrder(userId: number, items: ICartItem[], couponCode: string | null): Promise<number> {
    // Construir la cadena XML a partir del arreglo de items
    const xmlItems = items
      .map(item => `<item id="${item.id}" qty="${item.qty}" price="${item.price}" />`)
      .join('');
    const cartXml = `<items>${xmlItems}</items>`;

    // Preparar la petición a SQL Server
    const request = dbPool.request();
    
    request.input('UserId', mssql.Int, userId);
    request.input('CartXml', mssql.Xml, cartXml);
    // ENTRADA NUEVA: Mapeamos el código del cupón (puede ser string o null)
    request.input('CouponCode', mssql.VarChar(50), couponCode);
    request.output('GeneratedOrderId', mssql.Int);

    // Ejecutar el Stored Procedure actualizado
    const result = await request.execute('SP_ProcessCheckout');

    // Retornar el ID de la orden generada
    return result.output.GeneratedOrderId as number;
  },
};