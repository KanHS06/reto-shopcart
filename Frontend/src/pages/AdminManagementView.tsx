import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface CouponItem {
  id: number;
  code: string;
  discountPercentage: number;
  isActive: boolean;
}

export const AdminManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'coupons'>('users');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para nuevo cupón
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Endpoints que utilizaremos en el backend
      const usersRes = await api.get('/admin/users');
      const couponsRes = await api.get('/admin/coupons');
      
      setUsers(usersRes.data.data || usersRes.data);
      setCoupons(couponsRes.data.data || couponsRes.data);
    } catch (err) {
      setError('Error al cargar la información administrativa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', { code: newCode, discountPercentage: Number(newDiscount) });
      setNewCode('');
      setNewDiscount('');
      fetchData(); // Recargar datos
    } catch (err) {
      alert('Error al crear el cupón');
    }
  };

  if (loading) return <div className="text-center py-10">Cargando panel de administración...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Panel Exclusivo de Administrador</h1>

      {/* Pestañas de navegación interna */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-semibold border-b-2 ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
          onClick={() => setActiveTab('users')}
        >
          Gestión de Usuarios y Roles
        </button>
        <button
          className={`py-2 px-4 font-semibold border-b-2 ${activeTab === 'coupons' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
          onClick={() => setActiveTab('coupons')}
        >
          Gestión de Cupones de Descuento
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4 text-sm text-gray-500">#{u.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-semibold">
                      {u.role || 'Cliente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'coupons' && (
        <div>
          {/* Formulario para crear cupón */}
          <form onSubmit={handleCreateCoupon} className="bg-white p-6 shadow rounded-lg mb-6 border border-gray-100 flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de Cupón</label>
              <input 
                type="text" 
                value={newCode} 
                onChange={(e) => setNewCode(e.target.value)} 
                placeholder="EJ: DESCUENTO20" 
                className="border rounded px-3 py-2 text-sm"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">% Descuento</label>
              <input 
                type="number" 
                value={newDiscount} 
                onChange={(e) => setNewDiscount(e.target.value)} 
                placeholder="15" 
                className="border rounded px-3 py-2 text-sm"
                required 
              />
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-indigo-700">
              Crear Cupón
            </button>
          </form>

          {/* Listado de cupones */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descuento (%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{c.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{c.discountPercentage}%</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-semibold">
                        Activo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};