import { api } from './api';
import { User, AuthResponse } from '../types';

export const authService = {
  async login(correo: string, contrasena: string): Promise<AuthResponse> {
    // Mapeamos las propiedades al inglés que exige el contrato del backend
    const response = await api.post<AuthResponse>('/auth/login', { 
      email: correo, 
      password: contrasena 
    });
    
    // Si tu backend devuelve los datos directamente en response.data
    const data = response.data;
    
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data;
  },

  async register(nombre: string, correo: string, contrasena: string): Promise<AuthResponse> {
    // Mapeamos las propiedades al inglés que exige el contrato del backend
    const response = await api.post<AuthResponse>('/auth/register', { 
      name: nombre,
      email: correo, 
      password: contrasena 
    });
    
    // Si tu backend devuelve los datos directamente en response.data
    const data = response.data;

    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data;
  },

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user'); // Limpiamos también el usuario al salir
    window.location.href = '/login';
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};