-- Tabla de Usuarios
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);

-- Tabla de Tokens para manejo sesiones
CREATE TABLE RefreshTokens (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    is_revoked BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Tabla de Productos
CREATE TABLE Products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INT NOT NULL CHECK (stock >= 0), -- negativo a nivel de BD
    image_url VARCHAR(255),
    created_at DATETIME DEFAULT GETDATE()
);

-- Tabla de Órdenes
CREATE TABLE Orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, COMPLETED, CANCELLED
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- Detalle de la Orden
CREATE TABLE OrderDetails (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10,2) NOT NULL, -- Historial del precio al momento de comprar
    FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id)
);
-- Tabla de Cupones de Descuento
CREATE TABLE Coupons (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    expires_at DATETIME NOT NULL,
    is_active BIT DEFAULT 1
);

-- Tabla de Bitácora / Auditoría (Para rastrear acciones críticas)
CREATE TABLE AuditLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL, -- 'LOGIN', 'CHECKOUT', 'CREATE_PRODUCT', etc.
    description TEXT NOT NULL,
    ip_address VARCHAR(45) NULL,
    created_at DATETIME DEFAULT GETDATE()
);

ALTER TABLE Users 
ADD role VARCHAR(20) NOT NULL DEFAULT 'Cliente' 
CONSTRAINT CHK_Users_Role CHECK (role IN ('Cliente', 'Operador', 'Administrador'));

-- Tabla de Variantes
CREATE TABLE Variantes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    attributes NVARCHAR(255) NOT NULL, -- Ej: 'Talla: M, Color: Azul'
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INT NOT NULL CHECK (stock >= 0),
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Variantes_Product FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
);
GO

-- Tabla de Kardex
CREATE TABLE Kardex (
    IDMovimiento INT IDENTITY(1,1) PRIMARY KEY,
    IDVariante INT NOT NULL,
    TipoMovimiento VARCHAR(50) NOT NULL, -- 'ENTREGA', 'VENTA', 'AJUSTE', 'DEVOLUCION'
    Cantidad INT NOT NULL,
    Motivo NVARCHAR(255) NOT NULL,
    IDUsuario INT NOT NULL,
    FechaMovimiento DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Kardex_Variante FOREIGN KEY (IDVariante) REFERENCES Variantes(id),
    CONSTRAINT FK_Kardex_Usuario FOREIGN KEY (IDUsuario) REFERENCES Users(id),
    CONSTRAINT CHK_Cantidad_DiferenteDeCero CHECK (Cantidad <> 0)
);
GO
