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
        
        console.log('Estructura exacta devuelta por el backend:', data);

        // Validación dinámica de la estructura de datos para evitar que se rompa la interfaz
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data && typeof data === 'object' && Array.isArray((data as any).products)) {
          setProducts((data as any).products);
        } else if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
          setProducts((data as any).data);
        } else {
          setProducts([]); // Inicializador de respaldo seguro en caso de formato inesperado
        }
      } catch (err) {
        console.error('Error al cargar productos:', err);
        setError('No se pudo cargar el catálogo de productos. Verifica que el backend esté encendido.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

    const handleAddToCart = async (product: any) => {
    try {
        const exactId = product.id ?? product._id ?? product.productoId;

        await addToCart({
        id: exactId,
        productoId: exactId,
        productId: exactId,
        name: product.name || product.nombre,
        nombre: product.name || product.nombre,
        price: Number(product.price || product.precio || 0),
        precio: Number(product.price || product.precio || 0),
        cantidad: 1,
        quantity: 1,
        imageUrl: product.imageUrl || product.imagenUrl,
        imagenUrl: product.imageUrl || product.imagenUrl,
        stockDisponible: product.stock
        });
        alert(`¡"${product.name || product.nombre}" se agregó al carrito con éxito!`);
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
        {Array.isArray(products) && products.map((product: any) => (
        <div 
            key={product.id} 
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-shadow p-4"
        >
            <div>
            {/* Cambiado a product.imageUrl */}
            {product.imageUrl ? (
                <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-48 object-cover rounded-lg"
                />
            ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 font-medium rounded-lg">
                Sin imagen
                </div>
            )}
            
            <div className="p-4 space-y-2">
                {/* Cambiado a product.name y product.description */}
                <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">{product.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
            </div>
            </div>

            <div className="p-4 pt-0 space-y-3">
            <div className="flex justify-between items-center">
                {/* Cambiado a product.price */}
                <span className="text-xl font-bold text-blue-600">${Number(product.price).toFixed(2)}</span>
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