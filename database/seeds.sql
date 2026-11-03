-- Limpieza de datos previos
DELETE FROM OrderDetails;
DELETE FROM Orders;
DELETE FROM Products;
DELETE FROM RefreshTokens;
DELETE FROM Users;

-- Reiniciar los contadores de ID auto-incrementables
DBCC CHECKIDENT ('Users', RESEED, 0);
DBCC CHECKIDENT ('Products', RESEED, 0);
DBCC CHECKIDENT ('Orders', RESEED, 0);

-- Insertar Usuarios de Prueba, las contraseñas reales irían encriptadas
INSERT INTO Users (email, password_hash, name, created_at)
VALUES 
('admin@shop.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36XCXm0/V7.1Xm2.1H1K6S.', 'Administrador', GETDATE()),
('user@shop.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36XCXm0/V7.1Xm2.1H1K6S.', 'Juan Pérez', GETDATE());

-- Insertar Productos de Prueba
INSERT INTO Products (name, description, price, stock, image_url, created_at)
VALUES
('Audífonos Inalámbricos Pro', 'Cancelación activa de ruido, batería de 30 horas y resistencia al agua IPX4.', 89.99, 50, 'https://unsplash.com', GETDATE()),
('Teclado Mecánico RGB', 'Teclado mecánico compacto con switches mecánicos brown y retroiluminación RGB configurable.', 120.00, 25, 'https://unsplash.com', GETDATE()),
('Mouse Gamer Ergonómico', 'Sensor óptico de 16,000 DPI con 7 botones programables y pesas ajustables.', 45.50, 100, 'https://unsplash.com', GETDATE()),
('Monitor Curvo UltraWide 34"', 'Resolución QHD, tasa de refresco de 144Hz y panel VA perfecto para multitasking.', 349.99, 10, 'https://unsplash.com', GETDATE()),
('Cargador Inalámbrico Rápido 15W', 'Soporte de carga rápida para dispositivos iOS y Android con protección térmica.', 25.00, 150, 'https://unsplash.com', GETDATE()),
('Mochila Impermeable para Laptop', 'Compartimento acolchado para laptops de hasta 16 pulgadas con puerto de carga USB integrado.', 39.95, 5, 'https://unsplash.com', GETDATE());

INSERT INTO Coupons (code, discount_percent, expires_at, is_active)
VALUES 
('DESCUENTO10', 10.00, DATEADD(day, 30, GETDATE()), 1), -- Válido por 30 días
('COMPRARETO', 25.00, DATEADD(day, 15, GETDATE()), 1),  -- Válido por 15 días
('EXPIRADO50', 50.00, DATEADD(day, -1, GETDATE()), 1);  -- Expiró ayer