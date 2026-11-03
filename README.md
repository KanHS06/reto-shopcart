# ShopCart - API Backend

Este proyecto corresponde a la **Fase 1** del desarrollo de la plataforma productiva **ShopCart**. Consiste en un ecosistema backend modular y altamente escalable desarrollado bajo una arquitectura limpia por capas, integrado a una persistencia relacional con control concurrente estricto.

---

## Tecnologías y Requisitos

- **Entorno de Ejecución:** Node.js (v24 LTS o superior)
- **Lenguaje:** TypeScript (Configuración en Modo Estricto)
- **Base de Datos:** Microsoft SQL Server 2019+ (Instancia Local o Express)
- **E emitter de Desarrollo:** `tsx` (TypeScript Execute para ESM nativo)

---

## Arquitectura del Proyecto

El backend se diseñó utilizando una **Arquitectura Limpia Organizada por Capas Técnicas** para garantizar la separación de responsabilidades:

- `src/config/`: Orquestación de variables de entorno y Pool de conexiones de base de datos.
- `src/middlewares/`: Red de seguridad global (Manejador de excepciones interceptadas y validación JWT).
- `src/repositories/`: Capa de persistencia. Única autorizada para interactuar con el Pool de SQL Server y ejecutar Stored Procedures.
- `src/services/`: Capa lógica del negocio. Centraliza reglas operativas y sanitización antes de la persistencia.
- `src/controllers/`: Capa de transporte encargada de recibir las peticiones de red Express y responder códigos de estado HTTP semánticos.

---

## Decisiones Abiertas de Diseño y Negocio

Durante el desarrollo se tomaron elecciones técnicas estratégicas para resolver los problemas críticos expuestos en el negocio:

1. **Estrategia XML para el Checkout Atómico (Prevención de sobrecarga):** 
   En lugar de ejecutar bucles iterativos individuales desde Node.js para ir procesando artículo por artículo, el carrito de compras completo es transformado en una cadena **XML estructurada** que viaja en una sola petición de red hacia el procedimiento `SP_ProcessCheckout`. Esto minimiza la latencia de red a cero y permite a SQL Server validar y procesar todo de forma masiva en memoria en milisegundos.
2. **Control Concurrente Defensivo (Protección de Inventario):** 
   El inventario se protege directamente en el motor de base de datos combinando restricciones `CHECK (stock >= 0)` con una transacción atómica `BEGIN TRANSACTION`. Si al procesar el XML un artículo sobrepasa la disponibilidad física, la transacción entera hace un `ROLLBACK` total inmediato y el servicio propaga un error HTTP `409 Conflict`.
3. **Seguridad Avanzada por Doble Token (JWT):** 
   Se implementó un esquema de autenticación robusto basado en **Access Tokens de corta duración (15 minutos)** para proteger las peticiones de red y **Refresh Tokens de larga duración (7 días)** persistidos en la base de datos de manera histórica. Los endpoints de escritura del catálogo (`POST`, `PUT`, `DELETE` de productos) están bloqueados exclusivamente para cuentas que posean el Rol de Administrador verificado.

---

## Instalación y Puesta en Marcha

### 1. Preparación de la Base de Datos
1. Abre tu herramienta **SQL Server Management Studio (SSMS)**.
2. Crea una base de datos llamada `ShopCart` (o el nombre de tu preferencia).
3. Ejecuta de manera secuencial los scripts ubicados en la carpeta raíz `database/`:
   - `schema.sql` (Construcción de tablas y relaciones).
   - `seeds.sql` (Carga de catálogo base e inicialización de IDs).
   - `procedures.sql` (Instalación de Stored Procedures lógicos).

### 2. Configuración del Backend
Accede a la carpeta del servidor e instala sus dependencias:
```bash
cd backend
npm install
```

Crea tu archivo de variables de entorno `.env` en la raíz de `backend/` tomando como referencia el archivo `.env.example`:
```env
PORT=3000
DB_USER=tu_usuario_sa
DB_PASSWORD=tu_contraseña_segura
DB_SERVER=localhost\\SQLEXPRESS
DB_DATABASE=ShopCart
JWT_SECRET=UnSecretoMuyLargoYFirmeParaTusTokensDeSesion
```

### 3. Ejecución del Servidor
Para iniciar el entorno de desarrollo con recarga automática en caliente ante cambios, ejecuta:
```bash
npm run dev
```
El backend confirmará en la consola una vez que establezca comunicación exitosa de red con tu instancia de SQL Server.

---

## Credenciales de Prueba por Defecto (Seeds)

- **Cuenta Administrador (Gestión de Inventario CRUD):** `admin@shop.com` / Contraseña de prueba.
- **Cuenta Cliente Estándar (Compras y Checkout):** `user@shop.com` / Contraseña de prueba.
