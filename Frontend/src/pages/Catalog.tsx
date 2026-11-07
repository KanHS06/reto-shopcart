import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

export const Catalog: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const [selectedVariants, setSelectedVariants] = useState<{ [key: number]: number }>({});
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await productService.getAll();
                
                if (Array.isArray(data)) {
                    setProducts(data);
                } else if (data && typeof data === 'object' && Array.isArray((data as any).products)) {
                    setProducts((data as any).products);
                } else if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
                    setProducts((data as any).data);
                } else {
                    setProducts([]);
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

    const handleVariantChange = (productId: number, variantId: number) => {
        setSelectedVariants(prev => ({ ...prev, [productId]: variantId }));
    };

    const handleAddToCart = async (productId: number, defaultVariantId: number) => {
        const idVarianteAEnviar = selectedVariants[productId] || defaultVariantId;
        
        const product = products.find(p => p.id === productId);
        const activeVariant = product?.variants?.find((v: any) => v.id === Number(idVarianteAEnviar)) || product?.variants?.[0] || product;

        if (activeVariant && Number(activeVariant.stock) <= 0) {
            alert('Lo sentimos, esta variante se encuentra agotada.');
            return;
        }

        try {
            await api.post('/cart/items', {
                userId: 1,
                idVariante: idVarianteAEnviar,
                quantity: 1
            });
            alert('¡Producto agregado al carrito con éxito!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'No se pudo agregar el producto al carrito.');
        }
    };

    if (loading) return <div className="text-center py-10 text-lg font-medium">Cargando productos...</div>;
    if (error) return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center my-6">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Catálogo de Productos</h1>
            </div>

            {products.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay productos disponibles en este momento.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.isArray(products) && products.map((product: any) => {
                        const hasMultipleVariants = Array.isArray(product.variants) && product.variants.length > 0;
                        const defaultVariantId = hasMultipleVariants ? product.variants[0].id : product.idVariante;
                        const currentVariantId = selectedVariants[product.id] || defaultVariantId;
                        
                        const activeVariant = hasMultipleVariants 
                            ? product.variants.find((v: any) => v.id === Number(currentVariantId)) || product.variants[0]
                            : product;

                        const displayPrice = activeVariant ? activeVariant.price : product.price;
                        const displayStock = activeVariant ? activeVariant.stock : product.stock;

                        return (
                            <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col justify-between p-4">
                                <div>
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded-lg" />
                                    ) : (
                                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 font-medium rounded-lg">Sin imagen</div>
                                    )}
                                    
                                    <div className="p-4 space-y-2">
                                        <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">{product.name}</h3>
                                        <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                                    </div>
                                </div>

                                <div className="p-4 pt-0 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold text-blue-600">Q{Number(displayPrice ?? 0).toFixed(2)}</span>
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${Number(displayStock) <= 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                            Stock: {displayStock ?? 0}
                                        </span>
                                    </div>

                                    {hasMultipleVariants && (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Opción / Variante:</label>
                                            <select 
                                                className="w-full border rounded p-1.5 text-sm bg-gray-50"
                                                value={currentVariantId}
                                                onChange={(e) => handleVariantChange(product.id, Number(e.target.value))}
                                            >
                                                {product.variants.map((variant: any) => (
                                                    <option key={variant.id} value={variant.id} disabled={variant.stock <= 0}>
                                                        {variant.attributes} {variant.sku ? `(SKU: ${variant.sku})` : ''} - Q{variant.price} {variant.stock <= 0 ? '[Agotado]' : `[Stock: ${variant.stock}]`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <button 
                                        onClick={() => handleAddToCart(product.id, defaultVariantId)}
                                        disabled={Number(displayStock) <= 0}
                                        className={`w-full py-2 rounded font-semibold transition-colors ${Number(displayStock) <= 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                    >
                                        {Number(displayStock) <= 0 ? 'Agotado' : 'Agregar al Carrito'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};