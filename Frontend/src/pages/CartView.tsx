import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export const CartView: React.FC = () => {
  const { items, removeFromCart, total, totalItems } = useCart();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Carrito de Compras</h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center space-y-4 border border-gray-100">
          <p className="text-gray-500 text-lg">Tu carrito está vacío.</p>
          <Link 
            to="/" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Listado de Ítems */}
          <div className="md:col-span-2 space-y-4">
            {items.map((item, index) => {
            const name = item.name || item.nombre || 'Producto sin nombre';
            const price = Number(item.price || item.precio || 0);
            const quantity = item.quantity || item.cantidad || 1;
            const image = item.imageUrl || item.imagenUrl;
            
            // Rastrillo de ID ultra-seguro: busca en inglés, base de datos (_id), español y usa el index de respaldo para la key de React
            const itemId = item.id ?? (item as any)._id ?? item.productoId ?? item.productId;
            const reactKey = itemId || `item-fallback-${index}`;

            return (
                <div 
                key={reactKey} // Corregido: Ahora React siempre tiene una Key única garantizada
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center justify-between gap-4"
                >
                {image ? (
                    <img src={image} alt={name} className="w-20 h-20 object-cover rounded-lg" />
                ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                    Sin imagen
                    </div>
                )}

                <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{name}</h3>
                    <p className="text-blue-600 font-bold">${price.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Cantidad: {quantity}</p>
                </div>

                <button
                onClick={() => {
                    if (itemId !== undefined && itemId !== null) {
                    removeFromCart(itemId);
                    } else {
                    console.error("No se pudo eliminar el producto porque no se detectó un ID válido", item);
                    }
                }}
                className="text-red-500 hover:text-red-700 text-sm font-medium p-2"
                >
                Eliminar
                </button>
                </div>
            );
            })}
          </div>

          {/* Resumen de Compra */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 h-fit space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Resumen de la Orden</h2>
            
            <div className="flex justify-between text-gray-600">
              <span>Total de ítems:</span>
              <span className="font-semibold">{totalItems}</span>
            </div>

            <div className="flex justify-between text-xl font-bold text-gray-800 border-t pt-2">
              <span>Total:</span>
              <span className="text-blue-600">${total.toFixed(2)}</span>
            </div>

            <button 
              onClick={() => alert('¡Funcionalidad de pago integrada con tu backend próximamente!')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors shadow-sm"
            >
              Proceder al Pago
            </button>
          </div>
        </div>
      )}
    </div>
  );
};