import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  
  if (!token || !savedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(savedUser);
    
    // Si se requiere un rol específico (ej. 'admin') y el usuario no lo tiene
    if (requiredRole && user.role !== requiredRole && user.rol !== requiredRole) {
      return <Navigate to="/" replace />; // Lo mandamos al inicio si no tiene permisos
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};