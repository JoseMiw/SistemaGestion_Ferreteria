CREATE DATABASE ferreteria_bd;

CREATE TABLE usuario (
    idUsuario INT AUTO_INCREMENT PRIMARY KEY,
    nombreUsuario VARCHAR(50) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    rol VARCHAR(50) DEFAULT 'VENDEDOR'
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
    nombre VARCHAR(100) NOT NULL,
    stock INT NOT NULL,
    precioVenta DECIMAL(10,2) NOT NULL,
    precioCompra DECIMAL(10,2) NOT NULL,
    descripcion VARCHAR(100) NOT NULL,
    estado VARCHAR(20),
    idProveedor INT NULL,
    FOREIGN KEY (idProveedor) REFERENCES proveedor(idProveedor)
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
    FOREIGN KEY (idVenta) REFERENCES venta(idVenta),
    FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario)
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
    FOREIGN KEY (idProveedor) REFERENCES proveedor(idProveedor),
    FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
    FOREIGN KEY (idSolicitudCompra) REFERENCES solicitud_compra(idSolicitudCompra)
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
-- INSERTAR DATOS DE PRUEBA
-- ============================================

-- Tipo de Pago, ESTO TODAVIA NO ESTA AGREGADO, SOLO LA TABLA
INSERT INTO tipo_pago VALUES(null, 'EFECTIVO', 'Pago en efectivo');
INSERT INTO tipo_pago VALUES(null, 'TARJETA_CREDITO', 'Pago con tarjeta de crédito');
INSERT INTO tipo_pago VALUES(null, 'TARJETA_DEBITO', 'Pago con tarjeta de débito');
INSERT INTO tipo_pago VALUES(null, 'TRANSFERENCIA', 'Transferencia bancaria');
INSERT INTO tipo_pago VALUES(null, 'YAPE', 'Pago con Yape');

-- Usuario (admin)
INSERT INTO usuario VALUES(null, 'Administrador', '123','Juan', 'Perez','admin@ferrepueblo.com', 'ADMINISTRADOR');
INSERT INTO usuario VALUES(null, 'Gerente', '123','Jose', 'Aguilar','gerente@ferrepueblo.com', 'GERENTE');
INSERT INTO usuario VALUES(null, 'Vendedor', '123', 'Pedro', 'Garcia', 'vendedor@ferrepueblo.com', 'VENDEDOR');
INSERT INTO usuario VALUES(null, 'AsistenteCompra', '123', 'Maria', 'Alvarado', 'asistente@ferrepueblo.com', 'ASISTENTE_COMPRA');
INSERT INTO usuario VALUES(null, 'Almacenero', '123', 'Luis', 'Ramirez', 'almacenero@ferrepueblo.com', 'ALMACENERO');

-- Cliente
INSERT INTO cliente VALUES(null, '12345678', 'Juan', 'Lopez', '987654321', 'juan@email.com');
INSERT INTO cliente VALUES(null, '87654321', 'María', 'Gómez', '987654322', 'maria@email.com');
INSERT INTO cliente VALUES(null, '08765431', 'Hector', 'Arias', '937332731', 'hector@email.com');

-- Proveedor
INSERT INTO proveedor VALUES(null, '12345678901', 'Ferretería Central SAC', '987654323', 'ventas@ferreteriacentral.com', 'Av. Principal 789');
INSERT INTO proveedor VALUES(null, '10987654321', 'Materiales del Norte', '987654324', 'info@materialesnorte.com', 'Calle Norte 456');

-- Producto
INSERT INTO producto VALUES(null,'Taladro Bosch', 20, 12.50, 15.00, "Bosch", "ACTIVO", 1);
INSERT INTO producto VALUES(null,'Martillo Stanley', 20, 10.50, 14.00, "Stanley", "ACTIVO", 1);
INSERT INTO producto VALUES(null,'Pintura Latex', 10, 9.50, 10.00, "Latex", "ACTIVO", 2);

INSERT INTO venta VALUES(null, NOW(), 100.00,18.00, 118.00, 'BOLETA', 1, 1, 1);
INSERT INTO venta VALUES(null, NOW(), 250.00,45.00, 295.00, 'FACTURA', 2, 1, 2);



SELECT * FROM producto;
SELECT * FROM venta;
SELECT * FROM cliente;
SELECT * FROM tipo_pago;
SELECT * FROM proveedor;
SELECT * FROM solicitud_compra;
SELECT * FROM usuario;
SELECT * FROM guia_entrada;
SELECT * FROM devolucion;
SELECT * FROM detalle_devolucion;
SELECT * FROM detalle_guia_entrada;
SELECT * FROM detalle_venta;

