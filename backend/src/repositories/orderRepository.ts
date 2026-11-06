import mssql from 'mssql';
import { dbPool } from '../config/db.js';

export interface ICartItem {
  productId?: number;
  quantity?: number;
  id?: number;
  qty?: number;
  price?: number;
}

export const orderRepository = {
  /**
   * Procesa el checkout convirtiendo el carrito de compras a XML 
   * y ejecutando la transacción atómica en SQL Server con cupón opcional.
   */
  async createOrder(userId: number, items: ICartItem[], couponCode: string | null): Promise<number> {
    // Mapeo seguro que captura tanto 'productId/quantity' como 'id/qty'
    const xmlItems = items
      .map(item => {
        const id = item.productId ?? item.id ?? 0;
        const qty = item.quantity ?? item.qty ?? 1;
        const price = item.price ?? (item as any).precio ?? 0;
        return `<item id="${id}" qty="${qty}" price="${price}" />`;
      })
      .join('');
      
    const cartXml = `<items>${xmlItems}</items>`;

    // Preparar la petición a SQL Server
    const request = dbPool.request();
    
    request.input('UserId', mssql.Int, userId);
    request.input('CartXml', mssql.Xml, cartXml);
    request.input('CouponCode', mssql.VarChar(50), couponCode);
    request.output('GeneratedOrderId', mssql.Int);

    // Ejecutar el Stored Procedure actualizado
    const result = await request.execute('SP_ProcessCheckout');

    // Retornar el ID de la orden generada
    return result.output.GeneratedOrderId as number;
  },
};