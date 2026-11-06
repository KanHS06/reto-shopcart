import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Catalog } from './pages/Catalog';
import { CartView } from './pages/CartView';
import { LoginView } from './pages/LoginView';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { UserOrdersView } from './pages/UserOrdersView';
import { AdminDashboardView } from './pages/AdminDashboardView';
import { AdminManagementView } from './pages/AdminManagementView';

// Componente interno para manejar la barra de navegación con estado de usuario
const NavigationBar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <Link to="/" className="font-bold text-xl text-blue-600">
        ShopCart - Tienda Online
      </Link>
      <nav className="space-x-4 flex items-center">
        <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium">Catálogo</Link>
        <Link to="/cart" className="text-gray-600 hover:text-blue-600 font-medium">Carrito</Link>

        {isAuthenticated && (
          <Link to="/my-orders" className="text-gray-600 hover:text-blue-600 font-medium">Mis Compras</Link>
        )}

        {isAuthenticated && ((user as any)?.rol === 'Administrador' || (user as any)?.role === 'Administrador' || (user as any)?.rol === 'Operador' || (user as any)?.role === 'Operador') && (
          <Link to="/admin/dashboard" className="text-purple-600 hover:text-purple-800 font-semibold">Panel Admin</Link>
        )}  

        {isAuthenticated && (user?.rol === 'Administrador' || user?.role === 'Administrador') && (
          <Link to="/admin/management" className="text-red-600 hover:text-red-800 font-semibold">
            Gestión Admin
          </Link>
        )}                
        
        {isAuthenticated ? (
          <div className="flex items-center space-x-3 ml-2">
            <span className="text-sm font-semibold text-gray-700">Hola, {user?.nombre || user?.name || 'Usuario'}</span>
            <button
              onClick={logout}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Salir
            </button>
          </div>
        ) : (
          <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Login
          </Link>
        )}
      </nav>
    </header>
  );
};

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 text-gray-900">
            <NavigationBar />
            
            <main className="container mx-auto px-4 py-6">
              <Routes>
                <Route path="/" element={<Catalog />} />
                <Route path="/login" element={<LoginView />} />
                
                {/* Ruta del carrito protegida para exigir sesión activa antes de ver/comprar */}
                <Route 
                  path="/cart" 
                  element={
                    <ProtectedRoute>
                      <CartView />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/my-orders" 
                  element={
                    <ProtectedRoute>
                      <UserOrdersView />
                    </ProtectedRoute>
                  } 
                />   

                <Route 
                  path="/admin/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['Administrador', 'Operador']}>
                      <AdminDashboardView />
                    </ProtectedRoute>
                  } 
                />  

                <Route 
                  path="/admin/management" 
                  element={
                    <ProtectedRoute allowedRoles={['Administrador']}>
                      <AdminManagementView />
                    </ProtectedRoute>
                  } 
                />                           

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;