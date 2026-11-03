import mssql from 'mssql';
import { dbPool } from '../config/db.js';

// Estructura del item tal como la espera recibir tu servicio o controlador
export interface ICartItem {
  id: number;
  qty: number;
  price: number;
}

export const orderRepository = {
  /**
   * Procesa el checkout convirtiendo el carrito de compras a XML 
   * y ejecutando la transacción en SQL Server.
   */
  async createOrder(userId: number, items: ICartItem[]): Promise<number> {
    // Construir la cadena XML a partir del arreglo de items
    const xmlItems = items
      .map(item => `<item id="${item.id}" qty="${item.qty}" price="${item.price}" />`)
      .join('');
    const cartXml = `<items>${xmlItems}</items>`;

    // Preparar la petición a SQL Server asignando inputs y el parámetro OUTPUT
    const request = dbPool.request();
    
    request.input('UserId', mssql.Int, userId);
    request.input('CartXml', mssql.Xml, cartXml);
    request.output('GeneratedOrderId', mssql.Int);

    // Ejecutar el Stored Procedure
    const result = await request.execute('SP_ProcessCheckout');

    // Retornar el ID de la orden generada que capturamos del parámetro OUTPUT
    return result.output.GeneratedOrderId as number;
  },
};