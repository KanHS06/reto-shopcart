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

interface Variante {
  id: number;
  sku: string;
  attributes: string;
  price: number;
  stock: number;
}

const InventoryManagement: React.FC<{ productId: number }> = ({ productId }) => {
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedVariante, setSelectedVariante] = useState<number | null>(null);
  const [tipoMovimiento, setTipoMovimiento] = useState('AJUSTE');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');

  const fetchVariantes = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${productId}/variants`);
      setVariantes(res.data.data);
    } catch (err) {
      console.error('Error al cargar variantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariantes();
  }, [productId]);

  const handleMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariante) return alert('Selecciona una variante');

    try {
      const res = await api.post('/inventory/movement', {
        idVariante: selectedVariante,
        tipoMovimiento,
        cantidad: Number(cantidad),
        motivo
      });
      alert(res.data.message);
      setCantidad('');
      setMotivo('');
      fetchVariantes(); 
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar el movimiento');
    }
  };

  if (loading) return <div className="text-center py-4">Cargando inventario de variantes...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-100 mt-4">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Gestión de Variantes y Kardex</h3>
      
      <table className="min-w-full divide-y divide-gray-200 mb-6">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Atributos</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {variantes.map((v) => (
            <tr 
              key={v.id} 
              className={`cursor-pointer ${selectedVariante === v.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`} 
              onClick={() => setSelectedVariante(v.id)}
            >
              <td className="px-4 py-2 text-sm font-bold text-gray-900">{v.sku}</td>
              <td className="px-4 py-2 text-sm text-gray-500">{v.attributes}</td>
              <td className="px-4 py-2 text-sm text-gray-500">${v.price}</td>
              <td className="px-4 py-2 text-sm font-semibold text-green-600">{v.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedVariante && (
        <form onSubmit={handleMovimiento} className="border-t pt-4 flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-700">Tipo</label>
            <select value={tipoMovimiento} onChange={(e) => setTipoMovimiento(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
              <option value="AJUSTE">Ajuste Manual</option>
              <option value="ENTRADA">Entrada / Compra</option>
              <option value="DEVOLUCION">Devolución</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Cantidad (+ / -)</label>
            <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Ej: 5 o -2" className="border rounded px-2 py-1.5 text-sm" required />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-700">Motivo (Obligatorio)</label>
            <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: Inventario físico inicial" className="border rounded px-2 py-1.5 text-sm w-full" required />
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-indigo-700">
            Registrar en Kardex
          </button>
        </form>
      )}
    </div>
  );
};

export const AdminManagementView: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'users' | 'coupons' | 'reports' | 'inventory'>('users');
  const [stats, setStats] = useState<any>(null);

  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const usersRes = await api.get('/admin/users');
      const couponsRes = await api.get('/admin/coupons');
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data.data);
      
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
      fetchData();
    } catch (err) {
      alert('Error al crear el cupón');
    }
  };

  if (loading) return <div className="text-center py-10">Cargando panel de administración...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Título general amigable */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Administración</h1>

      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          className={`py-2 px-4 font-semibold whitespace-nowrap border-b-2 ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
          onClick={() => setActiveTab('users')}
        >
          Gestión de Usuarios y Roles
        </button>
        <button
          className={`py-2 px-4 font-semibold whitespace-nowrap border-b-2 ${activeTab === 'coupons' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
          onClick={() => setActiveTab('coupons')}
        >
          Gestión de Cupones de Descuento
        </button>
        <button
          className={`py-2 px-4 font-semibold whitespace-nowrap border-b-2 ${activeTab === 'reports' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
          onClick={() => setActiveTab('reports')}
        >
          Reportes y Estadísticas
        </button>
        <button
          className={`py-2 px-4 font-semibold whitespace-nowrap border-b-2 ${activeTab === 'inventory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
          onClick={() => setActiveTab('inventory')}
        >
          Gestión de Inventario (Kardex)
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
          <form onSubmit={handleCreateCoupon} className="bg-white p-6 shadow rounded-lg mb-6 border border-gray-100 flex gap-4 items-end flex-wrap">
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

      {activeTab === 'reports' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Ingresos Totales</h3>
            <p className="text-2xl font-bold text-green-600 mt-2">${stats.totalRevenue?.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Total de Pedidos</h3>
            <p className="text-2xl font-bold text-indigo-600 mt-2">{stats.totalOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Usuarios Registrados</h3>
            <p className="text-2xl font-bold text-blue-600 mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Productos en Catálogo</h3>
            <p className="text-2xl font-bold text-purple-600 mt-2">{stats.totalProducts}</p>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div>
          <InventoryManagement productId={1} />
        </div>
      )}
    </div>
  );
};