import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import { useNavigate } from 'react-router-dom';

export const CartView: React.FC = () => {
  const { items } = useCart() as any;
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  // Calcular el total de la compra de forma segura
  const total = items.reduce((acc: number, item: any) => {
    const price = item.price ?? item.precio ?? 0;
    const qty = item.quantity ?? item.cantidad ?? 1;
    return acc + (price * qty);
  }, 0);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const orderPayload = {
        items: items.map((item: any) => {
          const pId = getProductId(item);
          const qty = Number(item.quantity ?? item.cantidad ?? 1);
          const price = Number(item.price ?? item.precio ?? 0); // <- Capturamos el precio de forma segura
          
          return {
            productId: pId,
            quantity: qty,
            price: price, // <- Lo incluimos en el payload que recibe el backend
          };
        }),
        couponCode: null
      };

      console.log("Payload final enviado al backend:", orderPayload);

      await orderService.createOrder(orderPayload);

      setSuccessMsg('¡Orden creada con éxito!');
      localStorage.removeItem('shopCart_items');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (err: any) {
      console.error('Error al crear la orden:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error al procesar la orden en el servidor.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getProductId = (item: any) => {
    // Imprimimos el item en consola para ver qué nombres de propiedades tiene exactamente
    console.log("Evaluando item del carrito:", item);
    
    // Probamos todas las variantes posibles de nombres de ID en tu base de datos (SQL Server / Mongo, etc.)
    const id = item.productId ?? item.productoId ?? item.id ?? item._id ?? item.product_id;
    
    return Number(id) || 0;
  };

  const handleUpdateQty = (itemId: any, newQty: number) => {
    if (newQty < 1) return;
    const updated = items.map((item: any) => {
      const currentId = getProductId(item);
      if (currentId === Number(itemId)) {
        return { ...item, quantity: newQty, cantidad: newQty };
      }
      return item;
    });
    localStorage.setItem('shopCart_items', JSON.stringify(updated));
    
    // En lugar de window.location.reload() que limpia estados de React, 
    // forzamos un evento de storage o actualizamos si tu contexto lo soporta, 
    // o si recargas, asegúrate de que el AuthContext lea el token (ver Paso 2).
    window.location.reload(); 
  };

  const handleRemove = (itemId: any) => {
    const updated = items.filter((item: any) => {
      const currentId = getProductId(item);
      return currentId !== Number(itemId);
    });
    localStorage.setItem('shopCart_items', JSON.stringify(updated));
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Tu Carrito de Compras</h1>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-center">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-center">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Tu carrito está vacío.</p>
      ) : (
        <div>
          <div className="divide-y divide-gray-200 mb-6">
            {items.map((item: any, index: number) => {
              const itemId = getProductId(item) || index;
              const itemName = item.name ?? item.nombre ?? 'Producto';
              const itemPrice = item.price ?? item.precio ?? 0;
              const itemQty = item.quantity ?? item.cantidad ?? 1;

              return (
                <div key={itemId} className="py-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-800">{itemName}</h3>
                    <p className="text-sm text-gray-500">Precio unitario: ${Number(itemPrice).toFixed(2)}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      {/* Botón Restar (-) vinculado a handleUpdateQty */}
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(itemId, itemQty - 1)}
                        disabled={itemQty <= 1}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="px-3 text-sm font-medium">{itemQty}</span>
                      {/* Botón Sumar (+) vinculado a handleUpdateQty */}
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(itemId, itemQty + 1)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-semibold text-gray-700 w-20 text-right">
                      ${(Number(itemPrice) * Number(itemQty)).toFixed(2)}
                    </span>

                    {/* Botón Eliminar vinculado a handleRemove */}
                    <button
                      type="button"
                      onClick={() => handleRemove(itemId)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium ml-2"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center border-t pt-4 mb-6">
            <span className="text-lg font-bold text-gray-800">Total:</span>
            <span className="text-xl font-bold text-blue-600">${total.toFixed(2)}</span>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm disabled:bg-green-300"
          >
            {loading ? 'Procesando Orden...' : 'Proceder al Pago / Crear Orden'}
          </button>
        </div>
      )}
    </div>
  );
};