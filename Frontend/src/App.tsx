import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Catalog } from './pages/Catalog';
import { CartView } from './pages/CartView';

// Placeholders temporales para las demás vistas
const Login = () => <div className="p-6 text-2xl font-bold">Iniciar Sesión (Próximamente)</div>;

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 text-gray-900">
            {/* Barra de navegación superior */}
            <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
              <Link to="/" className="font-bold text-xl text-blue-600">
                ShopCart - Tienda Online
              </Link>
              <nav className="space-x-4">
                <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium">Catálogo</Link>
                <Link to="/cart" className="text-gray-600 hover:text-blue-600 font-medium">Carrito</Link>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">Login</Link>
              </nav>
            </header>
            
            <main className="container mx-auto px-4 py-6">
              <Routes>
                <Route path="/" element={<Catalog />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cart" element={<CartView />} />
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