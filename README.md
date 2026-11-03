# ShopCart - Sistema Backend y Base de Datos

Este proyecto corresponde a la **Fase 1** del desarrollo de la plataforma e-commerce **ShopCart**. Consiste en un ecosistema backend modular, robusto y altamente seguro desarrollado bajo una arquitectura limpia por capas, integrado a una persistencia relacional en SQL Server con control concurrente estricto y auditoría automatizada.

---

## Tecnologías y Requisitos

- **Entorno de Ejecución:** Node.js (v24 LTS o superior)
- **Lenguaje:** TypeScript (Configuración en Modo Estricto)
- **Base de Datos:** Microsoft SQL Server 2019+ (Instancia Local o Express)
- **Ejecutor de Desarrollo:** `tsx` (TypeScript Execute para ESM nativo y recarga en caliente)

---

## Arquitectura del Proyecto

El backend está organizado de forma estricta por **Capas Técnicas** para garantizar la separación de responsabilidades y la mantenibilidad del código:

- `src/config/`: Orquestación de variables de entorno y Pool global de conexiones a SQL Server.
- `src/middlewares/`: Centralización de seguridad (Manejador global de excepciones e interceptor de autenticación JWT).
- `src/repositories/`: Capa de persistencia pura. Única autorizada para interactuar con la base de datos y ejecutar Stored Procedures.
- `src/services/`: Capa lógica de negocio. Centraliza las reglas, validaciones operativas y hash de datos.
- `src/controllers/`: Capa de transporte encargada de exponer los endpoints Express y responder códigos de estado HTTP semánticos.

---

## Decisiones Abiertas de Diseño y Lógica de Negocio

Durante el desarrollo se tomaron elecciones estratégicas para resolver los problemas de negocio:

1. **Estrategia XML para el Checkout Atómico (Cero Sobrecarga N+1):** 
   En lugar de ejecutar bucles iterativos individuales desde Node.js para impactar la base de datos por cada artículo comprado, el carrito de compras completo se transforma en una estructura **XML sanitizada** que viaja en un solo viaje de red hacia `SP_ProcessCheckout`. SQL Server parsea y valida todo de forma masiva en memoria en milisegundos.
2. **Motor Transaccional Defensivo (Protección de Stock y Cupones):** 
   El inventario se blinda directamente en el motor combinando restricciones `CHECK (stock >= 0)` con bloques `BEGIN TRANSACTION`. Si un artículo sobrepasa la disponibilidad física o el cupón ingresado no es válido/expiró, la transacción entera hace un `ROLLBACK` total inmediato y el sistema responde un código HTTP semántico (`409 Conflict` o `400 Bad Request`).
3. **Módulo de Cupones Dinámicos:** 
   La base de datos valida matemáticamente el porcentaje de descuento y las fechas de expiración de los cupones directamente en el flujo del checkout, aplicando la reducción monetaria de manera atómica en el monto final de la orden.
4. **Bitácora de Auditoría Automatizada (*Audit Log*):** 
   Para garantizar la trazabilidad del sistema, las operaciones críticas (como la creación de órdenes de compra con o sin cupones) disparan automáticamente registros históricos en la tabla `AuditLog` dentro del ciclo transaccional, asegurando que ninguna acción quede sin registrar.
5. **Seguridad Avanzada por Doble Token (JWT) y Roles:** 
   Se implementó un esquema basado en **Access Tokens de corta duración (15 minutos)** para el tráfico diario y **Refresh Tokens de larga duración (7 días)** almacenados históricamente en la base de datos. Los endpoints de escritura del catálogo (`POST`, `PUT`, `DELETE` de productos) están restringidos mediante middlewares para cuentas con Rol de Administrador verificado.

---

## Instalación y Puesta en Marcha

### 1. Preparación de la Base de Datos
1. Abre **SQL Server Management Studio (SSMS)**.
2. Crea una base de datos llamada `ShopCart`.
3. Ejecuta de manera secuencial los scripts ubicados en la carpeta raíz `database/`:
   - `schema.sql` (Construcción de tablas, relaciones y restricciones `CHECK`).
   - `seeds.sql` (Carga de productos iniciales, cupones de prueba e inicialización de contadores).
   - `procedures.sql` (Instalación de Stored Procedures lógicos y transaccionales).

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
Para iniciar el entorno de desarrollo, ejecuta:
```bash
npm run dev
```
El backend confirmará en la consola una vez que establezca comunicación exitosa con tu instancia local de SQL Server.

---

## Credenciales de Prueba por Defecto (Seeds)

- **Cuenta Administrador (Gestión CRUD de Inventario):** `admin@shop.com` / Contraseña de prueba.
- **Cuenta Cliente Estándar (Compras, Cupones y Checkout):** `user@shop.com` / Contraseña de prueba.
- **Cupones Disponibles:** `DESCUENTO10` (10% válido), `COMPRARETO` (25% válido), `EXPIRADO50` (Expirado/Invalido).
