import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface CartItem {
  IDCarrito: number;
  IDItem: number;
  IDVariante: number;
  quantity: number;
  price: number;
  attributes: string;
  ProductName: string;
  sku?: string;
  variantStock?: number;
}

export const CartView: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cart?userId=1');
      setItems(res.data.data || []);
      setError(null);
    } catch (err: any) {
      setError('Error al cargar la información del carrito.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (item: CartItem, newQty: number) => {
    if (newQty <= 0) return;

    // Si el backend ya provee variantStock, validamos estrictamente contra él
    if (item.variantStock !== undefined && newQty > item.variantStock) {
      alert(`No puedes agregar más unidades. Stock disponible: ${item.variantStock}`);
      return;
    }

    try {
      await api.put(`/cart/items/${item.IDItem}`, { quantity: newQty });
      fetchCart();
    } catch (err: any) {
      alert(err.response?.data?.message || 'No se pudo actualizar la cantidad.');
    }
  };

  const handleRemoveItem = async (idItem: number) => {
    if (!confirm('¿Deseas quitar este producto de tu carrito?')) return;

    try {
      await api.delete(`/cart/items/${idItem}`);
      fetchCart();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar el producto.');
    }
  };

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal;

  if (loading) return <div className="text-center py-10 text-gray-600">Cargando carrito de compras...</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Carrito de Compras</h1>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">{error}</div>}

      {items.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow border text-center text-gray-500">
          Tu carrito de compras está vacío.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items
              .filter((item) => item.IDItem && item.IDVariante)
              .map((item) => (
                <div key={item.IDItem} className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{item.ProductName}</h3>
                    <p className="text-xs text-gray-500">{item.attributes}</p>
                    {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                    <p className="text-sm font-semibold text-indigo-600 mt-1">Q {(item.price ?? 0).toFixed(2)}</p>
                    {item.variantStock !== undefined && (
                      <p className="text-xs text-gray-500 mt-0.5">Stock disponible: {item.variantStock}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center border rounded">
                      <button
                        onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 font-semibold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-bold text-sm text-gray-800 min-w-[70px] text-right">
                      Q {((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}
                    </span>

                    <button
                      onClick={() => handleRemoveItem(item.IDItem)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium ml-2"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 h-fit">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen del Pedido</h2>
            
            <div className="flex justify-between py-2 border-b text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-800">Q {subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-3 border-b text-lg font-bold text-gray-900">
              <span>Total</span>
              <span className="text-indigo-600">Q {total.toFixed(2)}</span>
            </div>

            <button className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
              Continuar Compra
            </button>
          </div>
        </div>
      )}
    </div>
  );
};