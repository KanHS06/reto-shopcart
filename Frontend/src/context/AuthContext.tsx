import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (correo: string, contrasena: string) => Promise<void>;
  register: (nombre: string, correo: string, contrasena: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token) {
      if (savedUser && savedUser !== "undefined" && savedUser !== "null") {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Error al parsear el usuario guardado", e);
          setUser(null);
        }
      }
    }
  }, [],);

const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    
    const resData = response.data;
    
    // Buscamos el token de forma flexible en cualquier nivel de la respuesta
    const token = resData.token || resData.accessToken || resData.data?.token || resData.data?.accessToken;
    
    // Buscamos los datos del usuario de forma flexible
    const userData = resData.user || resData.data?.user || resData.data;

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } else {
      console.error("No se encontró el token en la estructura:", resData);
    }
  } catch (error) {
    console.error("Error en login:", error);
    throw error;
  }
};

  const register = async (nombre: string, correo: string, contrasena: string) => {
    try {
      const data = await authService.register(nombre, correo, contrasena);
      
      const userData = (data as any).user || (data as any).data?.user;
      
      setUser(userData);
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Error en AuthContext Register:", error);
      throw error; //
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    authService.logout();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};