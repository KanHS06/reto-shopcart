import { api } from './api';
import { CartItem } from '../types';

export const cartService = {
  // Obtener carrito (del servidor o adaptado de invitado)
  async getCart(isLoggedIn: boolean): Promise<CartItem[]> {
    if (isLoggedIn) {
      const response = await api.get<CartItem[]>('/carrito');
      return response.data;
    } else {
      // Carrito para invitados almacenado localmente
      const localCart = localStorage.getItem('guestCart');
      return localCart ? JSON.parse(localCart) : [];
    }
  },

  // Sincronizar o agregar ítem
  async addItem(item: CartItem, isLoggedIn: boolean): Promise<void> {
    if (isLoggedIn) {
      await api.post('/carrito/agregar', { productoId: item.productoId, cantidad: item.cantidad });
    } else {
      const cart: CartItem[] = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const existingIndex = cart.findIndex(i => i.productoId === item.productoId);
      
      if (existingIndex > -1) {
        cart[existingIndex].cantidad += item.cantidad;
      } else {
        cart.push(item);
      }
      localStorage.setItem('guestCart', JSON.stringify(cart));
    }
  },

  // Eliminar ítem
  async removeItem(productoId: string | number, isLoggedIn: boolean): Promise<void> {
    if (isLoggedIn) {
      await api.delete(`/carrito/${productoId}`);
    } else {
      let cart: CartItem[] = JSON.parse(localStorage.getItem('guestCart') || '[]');
      cart = cart.filter(i => i.productoId !== productoId);
      localStorage.setItem('guestCart', JSON.stringify(cart));
    }
  }
};