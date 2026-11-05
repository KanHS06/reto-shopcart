import { api } from './api';
import { User, AuthResponse } from '../types';

export const authService = {
  async login(correo: string, contrasena: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', { correo, contrasena });
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data;
  },

  async register(nombre: string, correo: string, contrasena: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', { nombre, correo, contrasena });
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  },

  getCurrentUser(): User | null {
    //datos del usuario en localStorage o decodificarlos del token
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};