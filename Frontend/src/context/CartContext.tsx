import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (productoId: string | number) => Promise<void>;
  total: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | null>(null);

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadCart();
  }, [isAuthenticated]);

  const loadCart = async () => {
    try {
      const cartItems = await cartService.getCart(isAuthenticated);
      setItems(cartItems);
    } catch (error) {
      console.error('Error al cargar el carrito:', error);
    }
  };

  const addToCart = async (item: CartItem) => {
    await cartService.addItem(item, isAuthenticated);
    await loadCart();
  };

  const removeFromCart = async (productoId: string | number) => {
    await cartService.removeItem(productoId, isAuthenticated);
    await loadCart();
  };

  const total = items.reduce((acc, item) => {
    const price = Number(item.price || item.precio || 0);
    const qty = Number(item.quantity || item.cantidad || 0);
    return acc + (price * qty);
  }, 0);

const totalItems = items.reduce((acc, item) => {
  const qty = Number(item.quantity || item.cantidad || 0);
  return acc + qty;
}, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, total, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};