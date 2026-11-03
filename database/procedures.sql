--------------------------------------------------------------------------------
-- Autenticar Usuario y Retornar Datos
--------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_GetUserByEmail
    @Email VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT id, email, password_hash, name, created_at
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
-- Checkout del Carrito de Compras
--------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_ProcessCheckout
    @UserId INT,
    @CartXml XML, -- Estructura esperada: <items><item id="1" qty="2" price="89.99" /></items>
    @GeneratedOrderId INT OUTPUT -- Retorna el ID de la orden generada al Backend
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; -- Si ocurre un error, ROLLBACK 

    -- Variables de control
    DECLARE @TotalAmount DECIMAL(10,2) = 0;
    
    -- Crear una tabla temporal para estructurar y validar el XML del carrito
    CREATE TABLE #TmpCart (
        product_id INT,
        quantity INT,
        price DECIMAL(10,2)
    );

    -- Parsear el XML e insertarlo en la tabla temporal
    INSERT INTO #TmpCart (product_id, quantity, price)
    SELECT 
        Param.Item.value('@id', 'INT'),
        Param.Item.value('@qty', 'INT'),
        Param.Item.value('@price', 'DECIMAL(10,2)')
    FROM @CartXml.nodes('/items/item') AS Param(Item);

    -- Calcular el monto total acumulado de la compra
    SELECT @TotalAmount = SUM(quantity * price) FROM #TmpCart;

    -- INICIAR TRANSACCIÓN SEGURA
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Si hay algún registro donde el stock disponible sea menor a la cantidad solicitada, lanza error
        IF EXISTS (
            SELECT 1 
            FROM #TmpCart t
            JOIN Products p ON t.product_id = p.id
            WHERE p.stock < t.quantity
        )
        BEGIN
            RAISERROR('STOCK_INSUFFICIENT: Uno o más productos seleccionados ya no cuentan con stock disponible.', 16, 1);
        END

        -- Insertar la cabecera de la Orden
        INSERT INTO Orders (user_id, total_amount, status, created_at)
        VALUES (@UserId, @TotalAmount, 'COMPLETED', GETDATE());

        -- Capturar el ID generado para la nueva orden
        SET @GeneratedOrderId = SCOPE_IDENTITY();

        -- Insertar los detalles de la Orden desde nuestra tabla temporal
        INSERT INTO OrderDetails (order_id, product_id, quantity, price_at_purchase)
        SELECT @GeneratedOrderId, product_id, quantity, price
        FROM #TmpCart;

        -- Actualizar el Inventario
        UPDATE p
        SET p.stock = p.stock - t.quantity
        FROM Products p
        JOIN #TmpCart t ON p.id = t.product_id;

        -- CONFIRMAR OPERACIONES SI TODO FUE EXITOSO
        COMMIT TRANSACTION;

        -- Limpieza de tabla temporal
        DROP TABLE #TmpCart;

    END TRY
    BEGIN CATCH
        -- Si algo falló dentro del bloque (Falta de stock, error de BD), deshace todo de inmediato
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END

        -- Limpieza de tabla temporal ante fallos
        IF OBJECT_ID('tempdb..#TmpCart') IS NOT NULL DROP TABLE #TmpCart;

        -- Propagar el error original hacia Node.js para que el errorHandler lo capture
        THROW;
    END CATCH
END;
GO
