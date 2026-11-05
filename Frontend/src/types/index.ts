// --- USUARIOS Y AUTENTICACIÓN ---
export interface User {
  id: number | string;
  nombre: string;
  correo: string;
  rol: 'cliente' | 'admin';
}

export interface AuthResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: User;
}

// --- PRODUCTOS ---
export interface Product {
  id: number | string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagenUrl?: string;
  categoriaId?: number | string;
}

// --- CARRITO DE COMPRAS ---
export interface CartItem {
  id: number | string;         // ID del ítem en el carrito o del producto
  productoId: number | string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagenUrl?: string;
  stockDisponible: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  cantidadTotal: number;
}

// --- ÓRDENES ---
export interface Order {
  id: number | string;
  usuarioId: number | string;
  total: number;
  estado: 'pendiente' | 'pagado' | 'enviado' | 'cancelado';
  fechaCreacion: string;
  items: CartItem[];
}