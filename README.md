#Sistema de Gestión de Ferretería
Sistema completo de gestión para ferretería desarrollado con Spring Boot (backend), Angular (frontend) y MySQL, diseñado para administrar inventario, ventas, compras, proveedores y clientes de manera eficiente y escalable.

#Características
Módulo de Administración
Gestión de Productos: CRUD completo con control de stock, precios de compra/venta y estado (activo/inactivo)

Control de Proveedores: Registro, búsqueda por RUC y gestión de datos de proveedores

Administración de Clientes: Gestión completa con búsqueda por código y registro rápido

Dashboard Administrativo: Panel con estadísticas, gráficos de ventas y stock crítico

Módulo de Ventas
Registro de Ventas: Interfaz intuitiva con búsqueda de clientes y productos

Carrito de Compras: Agregar productos con cantidades y cálculo automático de totales

Múltiples métodos de pago: Efectivo, Tarjeta, Transferencia, Yape

Tipos de Comprobante: Factura y Boleta

Devoluciones: Sistema completo de cambios y reembolsos con ajuste automático de stock

Historial de Ventas: Visualización detallada con filtros

Módulo de Compras
Solicitudes de Compra: Creación, aprobación y rechazo de solicitudes

Registro de Entregas: Recepción de productos con actualización automática de stock

Control de Inventario: Actualización en tiempo real de stock al recibir mercancía

Sistema de Seguridad
Autenticación de Usuarios: Login con roles y permisos

Control de Acceso por Rol:

ADMINISTRADOR: Acceso total al sistema

GERENTE: Acceso a todas las funciones administrativas

VENDEDOR: Gestión de ventas y clientes

ASISTENTE_COMPRA: Gestión de compras y proveedores

ALMACENERO: Visualización de inventario y compras

Funcionalidades Técnicas
Actualización Automática de Stock: Al realizar ventas, devoluciones o compras

Validación de Stock: Control para evitar ventas sin inventario suficiente

Cálculo Automático de Totales: Subtotal, IGV (18%) y total

Registro de Auditoría: Trazabilidad de todas las operaciones

🛠 Tecnologías
Backend
Spring Boot 3.x: Framework principal

Spring Data JPA: ORM para persistencia de datos

Spring Web: API RESTful

MySQL Connector: Conectividad con base de datos

Lombok: Reducción de código boilerplate

Maven: Gestión de dependencias

Frontend
Angular 17+: Framework para SPA

TypeScript: Tipado estático

Bootstrap 5: Estilos y componentes UI

Font Awesome: Iconografía

RxJS: Programación reactiva

HTTP Client: Comunicación con API REST

Base de Datos
MySQL 8+: Sistema gestor de base de datos

13 Tablas Relacionadas: Usuario, Cliente, Proveedor, Producto, Venta, DetalleVenta, Devolución, DetalleDevolución, SolicitudCompra, DetalleSolicitudCompra, GuíaEntrada, DetalleGuíaEntrada, TipoPago

📁 Estructura del Proyecto
Backend (/backend)
text
backend/
├── src/main/java/com/example/backend/
│   ├── controller/          # Controladores REST (8 controladores)
│   │   ├── ClienteController
│   │   ├── DevolucionController
│   │   ├── GuiaEntradaController
│   │   ├── ProductoController
│   │   ├── ProveedorController
│   │   ├── SolicitudCompraController
│   │   └── VentaController
│   ├── model/
│   │   ├── entity/          # Entidades JPA (13 entidades)
│   │   ├── repository/      # Repositorios JPA (10 repositorios)
│   │   └── service/         # Servicios de negocio (10 servicios)
│   └── BackendApplication.java
├── src/main/resources/
│   └── application.properties  # Configuración de base de datos
└── pom.xml                    # Dependencias Maven
Frontend (/frontend)
text
frontend/
├── src/app/
│   ├── guards/              # Guards de autenticación y permisos
│   │   ├── auth.guard.ts
│   │   └── permisos.guard.ts
│   ├── layout/              # Componentes compartidos
│   │   ├── header/
│   │   └── footer/
│   ├── models/              # Interfaces TypeScript (12 modelos)
│   ├── pagina/
│   │   ├── dashboard/       # Panel administrativo
│   │   │   ├── inicio-dashboard/
│   │   │   ├── productos/
│   │   │   │   ├── lista-productos/
│   │   │   │   └── formulario-producto/
│   │   │   ├── ventas/
│   │   │   │   ├── lista-ventas/
│   │   │   │   ├── formulario-venta/
│   │   │   │   ├── detalle-venta/
│   │   │   │   └── registrar-devolucion/
│   │   │   ├── compras/
│   │   │   │   ├── lista-solicitudes/
│   │   │   │   ├── formulario-solicitud/
│   │   │   │   ├── detalle-solicitud/
│   │   │   │   └── registrar-entrega/
│   │   │   └── clientes/
│   │   │       ├── clientes/
│   │   │       └── formulario-cliente/
│   │   ├── inicio/
│   │   ├── producto/
│   │   ├── nosotros/
│   │   └── contacto/
│   ├── services/            # Servicios HTTP (8 servicios)
│   │   ├── auth.service.ts
│   │   ├── cliente.service.ts
│   │   ├── producto.service.ts
│   │   ├── venta.service.ts
│   │   ├── solicitud.service.ts
│   │   ├── devolucion.service.ts
│   │   ├── entrega.service.ts
│   │   └── proveedor.service.ts
│   ├── shared/              # Componentes compartidos
│   │   └── modal-confirmacion/
│   ├── app.routes.ts        # Configuración de rutas
│   └── app.component.ts     # Componente principal
├── index.html
└── package.json
Base de Datos (/database)
text
database/
└── ferreteria_bd.sql        # Script completo con estructura y datos iniciales
🔧 Instalación y Ejecución
Requisitos Previos
Java 17+ (Backend)

Node.js 18+ (Frontend)

MySQL 8+ (Base de Datos)

Maven (Gestión de dependencias)

Git (Control de versiones)
