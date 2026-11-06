import { api } from './api';

export interface OrderItem {
  productId: number | string;
  quantity: number;
}

export interface CreateOrderPayload {
  items: OrderItem[];
  couponCode?: string | null;
}

export const orderService = {
  async createOrder(payload: CreateOrderPayload): Promise<any> {
    // Apuntamos al endpoint /orders/checkout del backend
    const response = await api.post('/orders/checkout', payload);
    return response.data;
  },

  async getMyOrders(): Promise<any[]> {
    const response = await api.get('/orders');
    return response.data;
  }
};