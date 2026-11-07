--------------------------------------------------------------------------------
-- Autenticar Usuario y Retornar Datos
--------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_GetUserByEmail
    @Email VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT id, email, password_hash, name, role, created_at
    FROM Users
    WHERE email = @Email;
END;
GO

--------------------------------------------------------------------------------
-- Listar Catálogo de Productos Completo
--------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.SP_GetProductsCatalog
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Devolvemos los productos y anidamos sus variantes como un objeto JSON
    SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.image_url AS imageUrl,
        p.created_at,
        -- Subconsulta que agrupa todas las variantes del producto en formato JSON
        (
            SELECT v.id, v.sku, v.price, v.stock, v.attributes
            FROM dbo.Variantes v
            WHERE v.product_id = p.id
            FOR JSON PATH
        ) AS variantsJson
    FROM dbo.Products p;
END;
GO

--------------------------------------------------------------------------------
-- Registrar un nuevo usuario (INSERT)
--------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_RegisterUser
    @Email VARCHAR(150),
    @PasswordHash VARCHAR(255),
    @Name VARCHAR(100),
    @GeneratedUserId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validación: Evitar correos duplicados antes de insertar
    IF EXISTS (SELECT 1 FROM Users WHERE email = @Email)
    BEGIN
        RAISERROR('EMAIL_ALREADY_EXISTS', 16, 1);
        RETURN;
    END

    INSERT INTO Users (email, password_hash, name, created_at)
    VALUES (@Email, @PasswordHash, @Name, GETDATE());

    SET @GeneratedUserId = SCOPE_IDENTITY();
END;
GO

--------------------------------------------------------------------------------
-- Gestionar Refresh Tokens
--------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_SaveRefreshToken
    @UserId INT,
    @Token VARCHAR(255),
    @ExpiresAt DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Seguridad: Eliminamos tokens viejos del mismo usuario para evitar acumulación (DELETE)
    DELETE FROM RefreshTokens WHERE user_id = @UserId OR expires_at < GETDATE();

    -- Insertar el nuevo token dinámico (INSERT)
    INSERT INTO RefreshTokens (user_id, token, expires_at)
    VALUES (@UserId, @Token, @ExpiresAt);
END;
GO

--------------------------------------------------------------------------------
-- Crear un Producto (INSERT)
--------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_AdminCreateProduct
    @Name VARCHAR(150),
    @Description TEXT,
    @Price DECIMAL(10,2),
    @Stock INT,
    @ImageUrl VARCHAR(255),
    @GeneratedProductId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 1. Insertamos el producto principal
    INSERT INTO Products (name, description, price, stock, image_url, created_at)
    VALUES (@Name, @Description, @Price, @Stock, @ImageUrl, GETDATE());

    -- Capturamos el ID del producto recién creado
    SET @GeneratedProductId = SCOPE_IDENTITY();

    -- 2. Insertamos automáticamente su variante por defecto
    -- Usamos el precio y stock iniciales, y generamos un SKU base (ej. SKU-ID)
    INSERT INTO Variantes (id_producto, sku, price, stock, attributes)
    VALUES (
        @GeneratedProductId, 
        CONCAT('SKU-', @GeneratedProductId), 
        @Price, 
        @Stock, 
        'Estándar'
    );
END;
GO

--------------------------------------------------------------------------------
-- Actualizar un Producto (UPDATE)
--------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_AdminUpdateProduct
    @Id INT,
    @Name VARCHAR(150),
    @Description TEXT,
    @Price DECIMAL(10,2),
    @Stock INT,
    @ImageUrl VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Products
    SET name = @Name,
        description = @Description,
        price = @Price,
        stock = @Stock,
        image_url = @ImageUrl
    WHERE id = @Id;

    -- Devolver las filas afectadas para saber si el producto existía
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

--------------------------------------------------------------------------------
-- Eliminar un Producto (DELETE)
--------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_AdminDeleteProduct
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Controlando restricciones.
    DELETE FROM Products WHERE id = @Id;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

--------------------------------------------------------------------------------
-- PROCEDIMIENTO: Validar y Obtener un Cupón
--------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_GetCouponByCode
    @Code VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, code, discount_percent, expires_at, is_active
    FROM Coupons
    WHERE code = @Code AND is_active = 1 AND expires_at > GETDATE();
END;
GO

--------------------------------------------------------------------------------
-- PROCEDIMIENTO: Insertar en la Bitácora
--------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_CreateAuditLog
    @UserId INT,
    @Action VARCHAR(100),
    @Description TEXT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO AuditLog (user_id, action, description, created_at)
    VALUES (@UserId, @Action, @Description, GETDATE());
END;
GO

--------------------------------------------------------------------------------
-- ACTUALIZACIÓN DEL CHECKOUT (Con Cupones, Descuentos y Bitácora)
--------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_ProcessCheckout
    @UserId INT,
    @CartXml XML,
    @CouponCode VARCHAR(50) = NULL,
    @GeneratedOrderId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Subtotal DECIMAL(10,2) = 0;
    DECLARE @TotalAmount DECIMAL(10,2) = 0;
    DECLARE @DiscountPercent DECIMAL(5,2) = 0;
    
    CREATE TABLE #TmpCart (product_id INT, quantity INT, price DECIMAL(10,2));

    INSERT INTO #TmpCart (product_id, quantity, price)
    SELECT 
        Param.Item.value('@id', 'INT'),
        Param.Item.value('@qty', 'INT'),
        Param.Item.value('@price', 'DECIMAL(10,2)')
    FROM @CartXml.nodes('/items/item') AS Param(Item);

    SELECT @Subtotal = SUM(quantity * price) FROM #TmpCart;
    SET @TotalAmount = @Subtotal;

    IF @CouponCode IS NOT NULL AND @CouponCode <> ''
    BEGIN
        SELECT @DiscountPercent = discount_percent 
        FROM Coupons 
        WHERE code = @CouponCode AND is_active = 1 AND expires_at > GETDATE();

        IF @DiscountPercent > 0
        BEGIN
            SET @TotalAmount = @Subtotal - (@Subtotal * (@DiscountPercent / 100.00));
        END
        ELSE
        BEGIN
            RAISERROR('COUPON_INVALID: El cupón ingresado no es válido o ya expiró.', 16, 1);
            RETURN;
        END
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM #TmpCart t JOIN Products p ON t.product_id = p.id WHERE p.stock < t.quantity)
        BEGIN
            RAISERROR('STOCK_INSUFFICIENT', 16, 1);
        END

        INSERT INTO Orders (user_id, total_amount, status, created_at)
        VALUES (@UserId, @TotalAmount, 'COMPLETED', GETDATE());

        SET @GeneratedOrderId = SCOPE_IDENTITY();

        INSERT INTO OrderDetails (order_id, product_id, quantity, price_at_purchase)
        SELECT @GeneratedOrderId, product_id, quantity, price FROM #TmpCart;

        UPDATE p SET p.stock = p.stock - t.quantity FROM Products p JOIN #TmpCart t ON p.id = t.product_id;

        DECLARE @LogDesc VARCHAR(MAX);
        SET @LogDesc = 'Usuario generó la orden de compra #' + CAST(@GeneratedOrderId AS VARCHAR(10)) + (CASE WHEN @DiscountPercent > 0 THEN ' aplicando el cupón ' + @CouponCode ELSE '' END);
        
        EXEC SP_CreateAuditLog @UserId, 'CHECKOUT', @LogDesc;

        COMMIT TRANSACTION;
        DROP TABLE #TmpCart;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF OBJECT_ID('tempdb..#TmpCart') IS NOT NULL DROP TABLE #TmpCart;
        THROW;
    END CATCH
END;
GO

--------------------------------------------------------------------------------
-- Listar Órdenes por Usuario
--------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_GetOrdersByUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT id, total_amount AS total, status, created_at AS createdAt
    FROM Orders
    WHERE user_id = @UserId
    ORDER BY created_at DESC;
END;
GO

-- Procedure para obtener todos los usuarios
CREATE OR ALTER PROCEDURE SP_GetAllUsers
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, email, name, role, created_at FROM Users;
END;
GO

-- Procedure para obtener todos los cupones
CREATE OR ALTER PROCEDURE SP_GetAllCoupons
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, code, discount_percent as discountPercentage, is_active as isActive 
    FROM Coupons;
END;
GO

-- Procedure para crear un cupón
CREATE OR ALTER PROCEDURE SP_CreateCoupon
    @Code VARCHAR(50),
    @Discount DECIMAL(5,2)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Coupons (code, discount_percent, is_active)
    VALUES (@Code, @Discount, 1);
END;
GO

CREATE OR ALTER PROCEDURE SP_GetAdminDashboardStats
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        (SELECT COUNT(*) FROM Users) AS totalUsers,
        (SELECT COUNT(*) FROM Products) AS totalProducts,
        (SELECT COUNT(*) FROM Orders) AS totalOrders,
        (SELECT ISNULL(SUM(total_amount), 0) FROM Orders) AS totalRevenue;
END;
GO

-- Stored Procedure para registrar movimientos y validar que no quede stock en negativo
CREATE OR ALTER PROCEDURE SP_Kardex_RegistrarMovimiento
    @IDVariante INT,
    @TipoMovimiento VARCHAR(50),
    @Cantidad INT,
    @Motivo NVARCHAR(255),
    @IDUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StockActual INT;
    SELECT @StockActual = stock FROM Variantes WHERE id = @IDVariante;

    -- Validar regla de negocio: el stock de la variante no puede quedar en negativo
    IF (@StockActual + @Cantidad < 0)
    BEGIN
        RAISERROR('Error: Cantidad insuficiente en el stock.', 16, 1);
        RETURN;
    END

    -- Registrar el movimiento en el Kardex
    INSERT INTO Kardex (IDVariante, TipoMovimiento, Cantidad, Motivo, IDUsuario)
    VALUES (@IDVariante, @TipoMovimiento, @Cantidad, @Motivo, @IDUsuario);

    -- Actualizar el stock físico de la variante
    UPDATE Variantes 
    SET stock = stock + @Cantidad 
    WHERE id = @IDVariante;
END;
GO

CREATE OR ALTER PROCEDURE SP_Cupones_ValidarYAplicar
    @CodigoCupón VARCHAR(50),
    @MontoCompra DECIMAL(10,2),
    @IDCliente INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @IDCupon INT, @Vigencia DATETIME, @MontoMinimo DECIMAL(10,2), @Activo BIT;

    SELECT @IDCupon = id, @Vigencia = expires_at, @Activo = is_active 
    FROM Coupons 
    WHERE code = @CodigoCupón;

    -- Validar existencia y estado
    IF @IDCupon IS NULL OR @Activo = 0
    BEGIN
        RAISERROR('El cupón ingresado no es válido o ya no se encuentra activo.', 16, 1);
        RETURN;
    END

    -- Validar vigencia
    IF GETDATE() > @Vigencia
    BEGIN
        RAISERROR('Este cupón ha expirado.', 16, 1);
        RETURN;
    END

    SELECT 'Cupón aplicado con éxito' AS Mensaje;
END;
GO

CREATE OR ALTER PROCEDURE SP_Checkout_ReservarStock
    @IDVariante INT,
    @CantidadSolicitada INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @StockDisponible INT;
    SELECT @StockDisponible = stock FROM Variantes WHERE id = @IDVariante;

    IF @StockDisponible < @CantidadSolicitada
    BEGIN
        RAISERROR('Lo sentimos, la última unidad acaba de ser comprada por otro cliente o no hay stock suficiente.', 16, 1);
        RETURN;
    END

    -- Aquí procederías a realizar la reserva temporal de los 15 minutos
    SELECT 'Stock reservado correctamente' AS Mensaje;
END;
GO

CREATE OR ALTER PROCEDURE SP_Variantes_ObtenerPorProducto
    @ProductID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, product_id, sku, attributes, price, stock 
    FROM Variantes 
    WHERE product_id = @ProductID;
END;
GO

-- CARRITO POR USUARIO
CREATE PROCEDURE dbo.SP_Carrito_ObtenerPorUsuario
    @IDUsuario INT = NULL,
    @GuestToken VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @IDUsuario IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.Carts WHERE user_id = @IDUsuario)
        BEGIN
            INSERT INTO dbo.Carts (user_id, created_at, updated_at)
            VALUES (@IDUsuario, GETDATE(), GETDATE());
        END

        SELECT 
            c.IDCarrito, 
            ci.IDItem, 
            ci.IDVariante, 
            ci.quantity, 
            v.price, 
            v.attributes, 
            p.name AS ProductName
        FROM dbo.Carts c
        LEFT JOIN dbo.CartItems ci ON c.IDCarrito = ci.IDCarrito
        LEFT JOIN dbo.Variantes v ON ci.IDVariante = v.id
        LEFT JOIN dbo.Products p ON v.product_id = p.id
        WHERE c.user_id = @IDUsuario;
    END
    ELSE IF @GuestToken IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.Carts WHERE guest_token = @GuestToken)
        BEGIN
            INSERT INTO dbo.Carts (guest_token, created_at, updated_at)
            VALUES (@GuestToken, GETDATE(), GETDATE());
        END

        SELECT 
            c.IDCarrito, 
            ci.IDItem, 
            ci.IDVariante, 
            ci.quantity, 
            v.price, 
            v.attributes, 
            p.name AS ProductName
        FROM dbo.Carts c
        LEFT JOIN dbo.CartItems ci ON c.IDCarrito = ci.IDCarrito
        LEFT JOIN dbo.Variantes v ON ci.IDVariante = v.id
        LEFT JOIN dbo.Products p ON v.product_id = p.id
        WHERE c.guest_token = @GuestToken;
    END
END;
GO

--------------------------------------------------------------------------------
-- Actualizar la cantidad de un ítem en el carrito validando el stock
--------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Carrito_ActualizarCantidad
    @IDItem INT,
    @NewQuantity INT
AS
BEGIN
    SET NOCOUNT ON;

    IF (@NewQuantity <= 0)
    BEGIN
        RAISERROR('La cantidad debe ser mayor a cero.', 16, 1);
        RETURN;
    END

    -- Validar stock disponible de la variante asociada al ítem
    DECLARE @IDVariante INT, @StockDisponible INT;
    SELECT @IDVariante = IDVariante FROM CartItems WHERE IDItem = @IDItem;

    SELECT @StockDisponible = stock FROM Variantes WHERE id = @IDVariante;

    IF (@NewQuantity > @StockDisponible)
    BEGIN
        RAISERROR('Cantidad insuficiente en el stock.', 16, 1);
        RETURN;
    END

    UPDATE CartItems 
    SET quantity = @NewQuantity 
    WHERE IDItem = @IDItem;
END;
GO

--------------------------------------------------------------------------------
-- Eliminar un ítem específico del carrito
--------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Carrito_EliminarItem
    @IDItem INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM CartItems 
    WHERE IDItem = @IDItem;
END;
GO

-- SP para Agregar o Incrementar Ítem con validación estricta de esquema dbo.
CREATE OR ALTER PROCEDURE dbo.SP_Carrito_AgregarItem
    @IDUsuario INT = NULL,
    @GuestToken VARCHAR(255) = NULL,
    @IDVariante INT,
    @Quantity INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IDCarrito INT;

    IF @Quantity IS NULL OR @Quantity <= 0 SET @Quantity = 1;
    IF @IDUsuario IS NULL AND @GuestToken IS NULL SET @IDUsuario = 1;

    IF @IDUsuario IS NOT NULL
    BEGIN
        SELECT @IDCarrito = IDCarrito FROM dbo.Carts WHERE user_id = @IDUsuario;
        IF @IDCarrito IS NULL
        BEGIN
            INSERT INTO dbo.Carts (user_id, created_at, updated_at) VALUES (@IDUsuario, GETDATE(), GETDATE());
            SET @IDCarrito = SCOPE_IDENTITY();
        END
    END
    ELSE IF @GuestToken IS NOT NULL
    BEGIN
        SELECT @IDCarrito = IDCarrito FROM dbo.Carts WHERE guest_token = @GuestToken;
        IF @IDCarrito IS NULL
        BEGIN
            INSERT INTO dbo.Carts (guest_token, created_at, updated_at) VALUES (@GuestToken, GETDATE(), GETDATE());
            SET @IDCarrito = SCOPE_IDENTITY();
        END
    END

    -- Asegurar que se use estrictamente dbo.CartItems
    IF EXISTS (SELECT 1 FROM dbo.CartItems WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante)
    BEGIN
        UPDATE dbo.CartItems SET quantity = quantity + @Quantity WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.CartItems (IDCarrito, IDVariante, quantity) VALUES (@IDCarrito, @IDVariante, @Quantity);
    END
END;
GO

-- SP para Actualizar Cantidad con dbo.
CREATE OR ALTER PROCEDURE dbo.SP_Carrito_ActualizarCantidad
    @IDItem INT,
    @NewQuantity INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.CartItems SET quantity = @NewQuantity WHERE IDItem = @IDItem;
END;
GO

-- 3. SP para Eliminar Ítem con dbo.
CREATE OR ALTER PROCEDURE dbo.SP_Carrito_EliminarItem
    @IDItem INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.CartItems WHERE IDItem = @IDItem;
END;
GO

CREATE OR ALTER PROCEDURE SP_CrearOrdenDesdeCarrito
    @UserId INT,
    @GeneratedOrderId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;

    BEGIN TRY
        -- 1. Verificar si el usuario tiene un carrito activo usando la tabla Carts
        DECLARE @CartId INT;
        SELECT @CartId = IDCarrito FROM Carts WHERE user_id = @UserId;

        IF @CartId IS NULL
        BEGIN
            RAISERROR('No se encontró un carrito activo para este usuario.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Verificar si hay ítems en el carrito
        IF NOT EXISTS (SELECT 1 FROM CartItems WHERE IDCarrito = @CartId)
        BEGIN
            RAISERROR('El carrito está vacío.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 2. Validar stock de todas las variantes antes de procesar
        DECLARE @InvalidVariantName VARCHAR(150);
        SELECT TOP 1 @InvalidVariantName = p.name 
        FROM CartItems ci
        INNER JOIN Variantes v ON ci.IDVariante = v.id
        INNER JOIN Products p ON v.product_id = p.id
        WHERE ci.IDCarrito = @CartId AND ci.quantity > v.stock;

        IF @InvalidVariantName IS NOT NULL
        BEGIN
            RAISERROR('Stock insuficiente para uno o más productos en el carrito.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 3. Calcular el monto total del pedido
        DECLARE @TotalAmount DECIMAL(10,2);
        SELECT @TotalAmount = SUM(ci.quantity * v.price)
        FROM CartItems ci
        INNER JOIN Variantes v ON ci.IDVariante = v.id
        WHERE ci.IDCarrito = @CartId;

        -- 4. Crear la Orden principal
        INSERT INTO Orders (user_id, total_amount, status, created_at)
        VALUES (@UserId, @TotalAmount, 'COMPLETED', GETDATE());

        SET @GeneratedOrderId = SCOPE_IDENTITY();

        -- 5. Insertar los detalles de la orden
        INSERT INTO OrderDetails (order_id, variant_id, quantity, price_at_purchase)
        SELECT 
            @GeneratedOrderId,
            ci.IDVariante,
            ci.quantity,
            v.price
        FROM CartItems ci
        INNER JOIN Variantes v ON ci.IDVariante = v.id
        WHERE ci.IDCarrito = @CartId;

        -- 6. Descontar automáticamente el stock de la tabla Variantes
        UPDATE v
        SET v.stock = v.stock - ci.quantity
        FROM Variantes v
        INNER JOIN CartItems ci ON v.id = ci.IDVariante
        WHERE ci.IDCarrito = @CartId;

        -- 7. Limpiar el carrito del usuario
        DELETE FROM CartItems WHERE IDCarrito = @CartId;

        -- Confirmar transacción
        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO