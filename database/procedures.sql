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
CREATE OR ALTER PROCEDURE SP_GetProductsCatalog
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT id, name, description, price, stock, image_url, created_at
    FROM Products;
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
    
    INSERT INTO Products (name, description, price, stock, image_url, created_at)
    VALUES (@Name, @Description, @Price, @Stock, @ImageUrl, GETDATE());

    SET @GeneratedProductId = SCOPE_IDENTITY();
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
CREATE PROCEDURE SP_GetAllUsers
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, email, name, role, created_at FROM Users;
END;
GO

-- Procedure para obtener todos los cupones
CREATE PROCEDURE SP_GetAllCoupons
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, code, discount_percent as discountPercentage, is_active as isActive 
    FROM Coupons;
END;
GO

-- Procedure para crear un cupón
CREATE PROCEDURE SP_CreateCoupon
    @Code VARCHAR(50),
    @Discount DECIMAL(5,2)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Coupons (code, discount_percent, is_active)
    VALUES (@Code, @Discount, 1);
END;
GO