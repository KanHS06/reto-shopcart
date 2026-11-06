import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('Cliente' | 'Operador' | 'Administrador')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  const savedUser = localStorage.getItem('user');
  
  if (!token || !savedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(savedUser);
    const userRole = user.role || user.rol || 'Cliente'; // Por defecto Cliente
    
    // Si se especificaron roles permitidos y el usuario no los tiene
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />; // Redirigir al catálogo si no tiene permisos
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};