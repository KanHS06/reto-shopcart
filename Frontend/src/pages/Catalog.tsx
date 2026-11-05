import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';

export const Catalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getAll();
        setProducts(data);
      } catch (err) {
        console.error('Error al cargar productos:', err);
        setError('No se pudo cargar el catálogo de productos. Verifica que el backend esté encendido.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart({
        id: product.id,
        productoId: product.id,
        nombre: product.nombre,
        precio: product.precio,
        cantidad: 1,
        imagenUrl: product.imagenUrl,
        stockDisponible: product.stock
      });
      alert(`¡"${product.nombre}" se agregó al carrito con éxito!`);
    } catch (err) {
      console.error('Error al agregar al carrito:', err);
      alert('Hubo un error al agregar el producto al carrito.');
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-lg font-medium">Cargando productos...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center my-6">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Catálogo de Productos</h1>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay productos disponibles en este momento.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-shadow"
            >
              <div>
                {product.imagenUrl ? (
                  <img 
                    src={product.imagenUrl} 
                    alt={product.nombre} 
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 font-medium">
                    Sin imagen
                  </div>
                )}
                
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">{product.nombre}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{product.descripcion}</p>
                </div>
              </div>

              <div className="p-4 pt-0 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-blue-600">${product.precio.toFixed(2)}</span>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                    Stock: {product.stock}
                  </span>
                </div>

                <button 
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock <= 0}
                  className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                    product.stock > 0 
                      ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {product.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};