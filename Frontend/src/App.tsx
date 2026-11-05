import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Aquí importaremos las páginas más adelante cuando las creemos
// Por ahora dejamos placeholders o rutas base
const Home = () => <div className="p-6 text-2xl font-bold">Catálogo de Productos (Próximamente)</div>;
const Login = () => <div className="p-6 text-2xl font-bold">Iniciar Sesión (Próximamente)</div>;
const CartView = () => <div className="p-6 text-2xl font-bold">Vista del Carrito (Próximamente)</div>;

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 text-gray-900">
            {/* Aquí iría tu barra de navegación (Navbar) */}
            <header className="bg-white shadow p-4 font-semibold text-xl">
              ShopCart - Tienda Online
            </header>
            
            <main className="container mx-auto py-6">
              <Routes>
                <Route path="/" element={<Home />} />
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