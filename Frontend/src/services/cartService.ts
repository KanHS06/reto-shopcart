import { api } from './api';
import { CartItem } from '../types';

export const cartService = {
  // El carrito se gestiona de forma local ya que el backend no tiene una tabla/modelo de carrito independiente
  async getCart(_isLoggedIn?: boolean): Promise<CartItem[]> {
    const stored = localStorage.getItem('shopCart_items');
    return stored ? JSON.parse(stored) : [];
  },

  async addItem(item: CartItem, _isLoggedIn: boolean): Promise<void> {
    const stored = localStorage.getItem('shopCart_items');
    const cart: CartItem[] = stored ? JSON.parse(stored) : [];
    
    const productId = item.id ?? item.productoId ?? item.productId;
    const quantity = item.cantidad ?? item.quantity ?? 1;

    const existingIndex = cart.findIndex(
      (i) => (i.id ?? i.productoId ?? i.productId) === productId
    );

    if (existingIndex > -1) {
      const currentQty = Number(cart[existingIndex].cantidad || cart[existingIndex].quantity || 1);
      cart[existingIndex].cantidad = currentQty + Number(quantity);
      cart[existingIndex].quantity = cart[existingIndex].cantidad;
    } else {
      cart.push({ ...item, cantidad: Number(quantity), quantity: Number(quantity) });
    }
    
    localStorage.setItem('shopCart_items', JSON.stringify(cart));
  },

  async removeItem(productId: string | number, _isLoggedIn: boolean): Promise<void> {
    const stored = localStorage.getItem('shopCart_items');
    let cart: CartItem[] = stored ? JSON.parse(stored) : [];
    cart = cart.filter((i) => (i.id ?? i.productoId ?? i.productId) !== productId);
    localStorage.setItem('shopCart_items', JSON.stringify(cart));
  }
};