import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface Order {
  id: number;
  createdAt: string;
  total: number;
  status: string;
}

export const UserOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders/my-orders');
        // Ajusta según cómo devuelva los datos tu API (ej. response.data.data o response.data)
        setOrders(response.data.data || response.data);
      } catch (err: any) {
        setError('No se pudieron cargar tus órdenes. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <div className="text-center py-10">Cargando tus compras...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Mis Órdenes de Compra</h1>
      
      {orders.length === 0 ? (
        <p className="text-gray-600">Aún no has realizado ninguna orden.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white shadow rounded-lg p-6 flex justify-between items-center border border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Orden #{order.id}</p>
                <p className="text-sm text-gray-500">Fecha: {new Date(order.createdAt).toLocaleDateString()}</p>
                <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                  {order.status || 'Completada'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">${Number(order.total).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};