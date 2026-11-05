import { api } from './api';
import { Product } from '../types';

export const productService = {
  async getAll(): Promise<Product[]> {
    const response = await api.get<Product[]>('/productos');
    return response.data;
  },

  async getById(id: string | number): Promise<Product> {
    const response = await api.get<Product>(`/productos/${id}`);
    return response.data;
  }
};