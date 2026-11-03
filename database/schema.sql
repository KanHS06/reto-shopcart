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
