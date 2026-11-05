// --- USUARIOS Y AUTENTICACIÓN ---
export interface User {
  id: number | string;
  nombre: string;
  name?: string;
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
  id: number | string;
  productoId?: number | string;
  productId?: number | string;
  nombre?: string;
  name?: string;
  precio?: number;
  price?: number;
  cantidad?: number;
  quantity?: number;
  imagenUrl?: string;
  imageUrl?: string;
  stockDisponible?: number;
  stock?: number;
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