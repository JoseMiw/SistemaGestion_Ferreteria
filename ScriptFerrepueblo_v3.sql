-- ============================================================
-- FERREPUEBLO - SCRIPT COMPLETO v3 (instalación desde cero)
-- Incluye los cambios del Informe Unidad I: código y stock mínimo
-- (RF01/RF03), cotizaciones (RF04), órdenes de compra (RF05),
-- bloqueo de cuentas (RNF01) y datos de devolución (RF10).
-- Para una base v2 existente use Migracion_v2_a_v3.sql.
-- ============================================================
CREATE DATABASE ferreteria_bd_v2;
USE ferreteria_bd_v2;

-- ============================================
-- TABLA: USUARIO
-- La contraseña se cifra con BCrypt al iniciar el backend.
-- ============================================
CREATE TABLE usuario (
    idUsuario INT AUTO_INCREMENT PRIMARY KEY,
    nombreUsuario VARCHAR(50) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    rol VARCHAR(50) DEFAULT 'VENDEDOR',
    intentosFallidos INT NOT NULL DEFAULT 0,
    bloqueadoHasta DATETIME NULL
);

-- ============================================
-- TABLA: CLIENTE
-- ============================================
CREATE TABLE cliente (
    idCliente INT AUTO_INCREMENT PRIMARY KEY,
    DNI VARCHAR(8) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(15),
    correo VARCHAR(100)
);

-- ============================================
-- TABLA: PROVEEDOR
-- ============================================
CREATE TABLE proveedor (
    idProveedor INT AUTO_INCREMENT PRIMARY KEY,
    ruc VARCHAR(11) NOT NULL UNIQUE,
    nombreProveedor VARCHAR(150) NOT NULL,
    telefono VARCHAR(15),
    correo VARCHAR(100),
    direccion VARCHAR(200)
);

-- ============================================
-- TABLA: TIPO_PAGO
-- ============================================
CREATE TABLE tipo_pago (
    idTipoPago INT AUTO_INCREMENT PRIMARY KEY,
    nombreTipo VARCHAR(50) NOT NULL,
    descripcion VARCHAR(200)
);

-- ============================================
-- TABLA: PRODUCTO
-- ============================================
CREATE TABLE producto (
    idProducto INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    stock INT NOT NULL,
    stockMinimo INT NOT NULL DEFAULT 5,
    precioVenta DECIMAL(10,2) NOT NULL,
    precioCompra DECIMAL(10,2) NOT NULL,
    descripcion VARCHAR(100) NOT NULL,
    estado VARCHAR(20),
    idProveedor INT NULL,
    FOREIGN KEY (idProveedor) REFERENCES proveedor(idProveedor),
    CONSTRAINT chk_producto_stock CHECK (stock >= 0),
    CONSTRAINT chk_producto_stock_minimo CHECK (stockMinimo >= 0)
);

-- ============================================
-- TABLA: VENTA
-- ============================================
CREATE TABLE venta (
    idVenta INT AUTO_INCREMENT PRIMARY KEY,
    fechaVenta DATE,
    subtotal DECIMAL(10,2) NOT NULL,
    igv DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    tipoComprobante VARCHAR(20),
    idCliente INT NOT NULL,
    idUsuario INT NOT NULL,
    idTipoPago INT NOT NULL,
    FOREIGN KEY (idCliente) REFERENCES cliente(idCliente),
    FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
    FOREIGN KEY (idTipoPago) REFERENCES tipo_pago(idTipoPago)
);

-- ============================================
-- TABLA: DETALLE_VENTA
-- ============================================
CREATE TABLE detalle_venta (
    idDetalleVenta INT AUTO_INCREMENT PRIMARY KEY,
    cantidad INT NOT NULL,
    precioUnitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    idVenta INT NOT NULL,
    idProducto INT NOT NULL,
    FOREIGN KEY (idVenta) REFERENCES venta(idVenta) ON DELETE CASCADE,
    FOREIGN KEY (idProducto) REFERENCES producto(idProducto)
);

-- ============================================
-- TABLA: DEVOLUCION
-- ============================================
CREATE TABLE devolucion (
    idDevolucion INT AUTO_INCREMENT PRIMARY KEY,
    fechaDevolucion DATE,
    motivo VARCHAR(100) NOT NULL,
    idVenta INT NOT NULL,
    idUsuario INT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'APROBADA',
    tipo VARCHAR(20) NULL,
    montoReembolso DECIMAL(10,2) NULL,
    idProductoCambio INT NULL,
    cantidadCambio INT NULL,
    FOREIGN KEY (idVenta) REFERENCES venta(idVenta),
    FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
    FOREIGN KEY (idProductoCambio) REFERENCES producto(idProducto)
);

-- ============================================
-- TABLA: DETALLE_DEVOLUCION
-- ============================================
CREATE TABLE detalle_devolucion (
    idDetalleDevolucion INT AUTO_INCREMENT PRIMARY KEY,
    cantidad INT NOT NULL,
    motivo VARCHAR(100) NOT NULL,
    idDevolucion INT NOT NULL,
    idProducto INT NOT NULL,
    FOREIGN KEY (idDevolucion) REFERENCES devolucion(idDevolucion) ON DELETE CASCADE,
    FOREIGN KEY (idProducto) REFERENCES producto(idProducto)
);

-- ============================================
-- TABLA: SOLICITUD_COMPRA
-- ============================================
CREATE TABLE solicitud_compra (
    idSolicitudCompra INT AUTO_INCREMENT PRIMARY KEY,
    fechaCotizacion DATE NOT NULL,
    montoTotal DECIMAL(10,2) NOT NULL,
    idProveedor INT NOT NULL,
    idUsuario INT NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    FOREIGN KEY (idProveedor) REFERENCES proveedor(idProveedor),
    FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario)
);

-- ============================================
-- TABLA: DETALLE_SOLICITUD_COMPRA
-- ============================================
CREATE TABLE detalle_solicitud_compra (
    idDetalleSolicitudCompra INT AUTO_INCREMENT PRIMARY KEY,
    cantidad INT NOT NULL,
    precioUnitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    idSolicitudCompra INT NOT NULL,
    idProducto INT NOT NULL,
    FOREIGN KEY (idSolicitudCompra) REFERENCES solicitud_compra(idSolicitudCompra) ON DELETE CASCADE,
    FOREIGN KEY (idProducto) REFERENCES producto(idProducto)
);

-- ============================================
-- TABLA: COTIZACION (RF04)
-- ============================================
CREATE TABLE cotizacion (
    idCotizacion INT AUTO_INCREMENT PRIMARY KEY,
    fechaCotizacion DATE NOT NULL,
    fechaVigencia DATE NOT NULL,
    montoTotal DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADA',
    idProveedor INT NOT NULL,
    idUsuario INT NOT NULL,
    idSolicitudCompra INT NULL,
    FOREIGN KEY (idProveedor) REFERENCES proveedor(idProveedor),
    FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
    FOREIGN KEY (idSolicitudCompra) REFERENCES solicitud_compra(idSolicitudCompra),
    CONSTRAINT chk_cotizacion_vigencia CHECK (fechaVigencia >= fechaCotizacion)
);

CREATE TABLE detalle_cotizacion (
    idDetalleCotizacion INT AUTO_INCREMENT PRIMARY KEY,
    cantidad INT NOT NULL,
    precioUnitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    idCotizacion INT NOT NULL,
    idProducto INT NOT NULL,
    FOREIGN KEY (idCotizacion) REFERENCES cotizacion(idCotizacion) ON DELETE CASCADE,
    FOREIGN KEY (idProducto) REFERENCES producto(idProducto),
    CONSTRAINT chk_det_cotizacion_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_det_cotizacion_precio CHECK (precioUnitario > 0)
);

-- ============================================
-- TABLA: ORDEN_COMPRA (RF05)
-- ============================================
CREATE TABLE orden_compra (
    idOrdenCompra INT AUTO_INCREMENT PRIMARY KEY,
    fechaOrden DATE NOT NULL,
    montoTotal DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    idCotizacion INT NOT NULL UNIQUE,
    idProveedor INT NOT NULL,
    idUsuarioCreador INT NOT NULL,
    idUsuarioAprobador INT NULL,
    fechaAprobacion DATETIME NULL,
    FOREIGN KEY (idCotizacion) REFERENCES cotizacion(idCotizacion),
    FOREIGN KEY (idProveedor) REFERENCES proveedor(idProveedor),
    FOREIGN KEY (idUsuarioCreador) REFERENCES usuario(idUsuario),
    FOREIGN KEY (idUsuarioAprobador) REFERENCES usuario(idUsuario)
);

-- ============================================
-- TABLA: GUIA_ENTRADA
-- ============================================
CREATE TABLE guia_entrada (
    idGuiaEntrada INT AUTO_INCREMENT PRIMARY KEY,
    cantidad INT NOT NULL,
    costoUnitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    idProveedor INT NOT NULL,
    idUsuario INT NOT NULL,
    idSolicitudCompra INT,
    fechaEntrada DATE NULL,
    idOrdenCompra INT NULL,
    FOREIGN KEY (idProveedor) REFERENCES proveedor(idProveedor),
    FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
    FOREIGN KEY (idSolicitudCompra) REFERENCES solicitud_compra(idSolicitudCompra),
    FOREIGN KEY (idOrdenCompra) REFERENCES orden_compra(idOrdenCompra)
);

-- ============================================
-- TABLA: DETALLE_GUIA_ENTRADA
-- ============================================
CREATE TABLE detalle_guia_entrada (
    idDetalleGuiaEntrada INT AUTO_INCREMENT PRIMARY KEY,
    cantidad INT NOT NULL,
    costoUnitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    idGuiaEntrada INT NOT NULL,
    idProducto INT NOT NULL,
    FOREIGN KEY (idGuiaEntrada) REFERENCES guia_entrada(idGuiaEntrada) ON DELETE CASCADE,
    FOREIGN KEY (idProducto) REFERENCES producto(idProducto)
);

-- ============================================
-- DATOS DE PRUEBA
-- ============================================

INSERT INTO tipo_pago (nombreTipo, descripcion) VALUES
    ('EFECTIVO', 'Pago en efectivo'),
    ('TARJETA_CREDITO', 'Pago con tarjeta de crédito'),
    ('TARJETA_DEBITO', 'Pago con tarjeta de débito'),
    ('TRANSFERENCIA', 'Transferencia bancaria'),
    ('YAPE', 'Pago con Yape');

-- Contraseña inicial '123' en texto plano: el backend la cifra con BCrypt
-- al arrancar. Cámbiela desde "Cambiar contraseña" (mínimo 8 caracteres,
-- con letras y números).
INSERT INTO usuario (nombreUsuario, contraseña, nombres, apellidos, correo, rol) VALUES
    ('Administrador', '123', 'Juan', 'Perez', 'admin@ferrepueblo.com', 'ADMINISTRADOR'),
    ('Gerente', '123', 'Jose', 'Aguilar', 'gerente@ferrepueblo.com', 'GERENTE'),
    ('Vendedor', '123', 'Pedro', 'Garcia', 'vendedor@ferrepueblo.com', 'VENDEDOR'),
    ('AsistenteCompra', '123', 'Maria', 'Alvarado', 'asistente@ferrepueblo.com', 'ASISTENTE_COMPRA'),
    ('Almacenero', '123', 'Luis', 'Ramirez', 'almacenero@ferrepueblo.com', 'ALMACENERO');

INSERT INTO cliente (DNI, nombres, apellidos, telefono, correo) VALUES
    ('12345678', 'Juan', 'Lopez', '987654321', 'juan@email.com'),
    ('87654321', 'María', 'Gómez', '987654322', 'maria@email.com'),
    ('08765431', 'Hector', 'Arias', '937332731', 'hector@email.com');

INSERT INTO proveedor (ruc, nombreProveedor, telefono, correo, direccion) VALUES
    ('12345678901', 'Ferretería Central SAC', '987654323', 'ventas@ferreteriacentral.com', 'Av. Principal 789'),
    ('10987654321', 'Materiales del Norte', '987654324', 'info@materialesnorte.com', 'Calle Norte 456');

-- Precio de venta (incluye IGV) mayor que el precio de compra
INSERT INTO producto (codigo, nombre, stock, stockMinimo, precioVenta, precioCompra, descripcion, estado, idProveedor) VALUES
    ('PRD-0001', 'Taladro Bosch', 20, 5, 15.00, 12.50, 'Bosch', 'ACTIVO', 1),
    ('PRD-0002', 'Martillo Stanley', 20, 5, 14.00, 10.50, 'Stanley', 'ACTIVO', 1),
    ('PRD-0003', 'Pintura Latex', 4, 5, 10.00, 9.50, 'Latex', 'ACTIVO', 2);
