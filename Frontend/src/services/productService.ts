import { api } from './api';
import { Product } from '../types';

export const productService = {
  async getAll(): Promise<Product[]> {
    const response = await api.get<Product[]>('/products');
    return response.data;
  },

  async getById(id: string | number): Promise<Product> {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  }
};