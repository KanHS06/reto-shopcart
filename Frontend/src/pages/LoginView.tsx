import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginView: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [nombre, setNombre] = useState<string>('');
  const [correo, setCorreo] = useState<string>('');
  const [contrasena, setContrasena] = useState<string>('');
  
  // Usamos localStorage para el error para evitar que un re-montaje lo borre
  const [error, setError] = useState<string | null>(() => {
    return localStorage.getItem('login_error_persistente');
  });
  
  const [loading, setLoading] = useState<boolean>(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Limpiamos el error persistente al desmontar o cambiar de pestaña
  useEffect(() => {
    return () => {
      localStorage.removeItem('login_error_persistente');
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setError(null);
    localStorage.removeItem('login_error_persistente');
    setLoading(true);

    try {
      if (isLogin) {
        await login(correo, contrasena);
        navigate('/');
      } else {
        await register(nombre, correo, contrasena);
        navigate('/');
      }
    } catch (err: any) {
      console.error('Error detallado de auth:', err);
      
      const rawData = err.response?.data;
      let finalErrorMsg = 'Correo o contraseña incorrectos.';

      // Verificamos si la respuesta es un string HTML o contiene doctype
      const isHtml = typeof rawData === 'string' && (rawData.includes('<!DOCTYPE') || rawData.includes('<html'));

      if (!isHtml && rawData) {
        if (typeof rawData === 'string') {
          finalErrorMsg = rawData;
        } else if (rawData.message) {
          finalErrorMsg = rawData.message;
        } else if (rawData.error) {
          finalErrorMsg = rawData.error;
        }
      }

      setError(finalErrorMsg);
      localStorage.setItem('login_error_persistente', finalErrorMsg);
    }finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 p-8 mt-10">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isLogin ? 'Accede a tu cuenta de ShopCart' : 'Regístrate para comenzar a comprar'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              required={!isLogin}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Tu nombre completo"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
          <input
            type="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            type="password"
            required
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm disabled:bg-blue-300"
        >
          {loading ? 'Procesando...' : isLogin ? 'Entrar' : 'Registrarse'}
        </button>
      </form>

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
            localStorage.removeItem('login_error_persistente');
          }}
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
};