import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { Inicio } from './pagina/inicio/inicio';
import { Producto } from './pagina/producto/producto';
import { Nosotros } from './pagina/nosotros/nosotros';
import { Contacto } from './pagina/contacto/contacto';
import { Dashboard } from './pagina/dashboard/dashboard';
import { ListaProductos } from './pagina/dashboard/lista-productos/lista-productos';
import { InicioDashboard } from './pagina/dashboard/inicio-dashboard/inicio-dashboard';
import { FormularioProducto } from './pagina/dashboard/formulario-producto/formulario-producto';
import { ListaVentas } from './pagina/dashboard/ventas/lista-ventas/lista-ventas';
import { FormularioVenta } from './pagina/dashboard/ventas/formulario-venta/formulario-venta';
import { Clientes } from './pagina/dashboard/clientes/clientes';
import { FormularioCliente } from './pagina/dashboard/clientes/formulario-cliente/formulario-cliente';
import { ListaSolicitudes } from './pagina/dashboard/compras/lista-solicitudes/lista-solicitudes';
import { FormularioSolicitud } from './pagina/dashboard/compras/formulario-solicitud/formulario-solicitud';
import { DetalleSolicitud } from './pagina/dashboard/compras/detalle-solicitud/detalle-solicitud';
import { AuthGuard } from './guards/auth.guard';
import { PermisosGuard } from './guards/permisos.guard';
import { DetalleVenta } from './pagina/dashboard/ventas/detalle-venta/detalle-venta';
import { RegistrarEntrega } from './pagina/dashboard/compras/registrar-entrega/registrar-entrega';
import { RegistrarDevolucion } from './pagina/dashboard/ventas/registrar-devolucion/registrar-devolucion';
import { StockBajo } from './pagina/dashboard/inventario/stock-bajo/stock-bajo';
import { ListaCotizaciones } from './pagina/dashboard/compras/cotizaciones/lista-cotizaciones/lista-cotizaciones';
import { FormularioCotizacion } from './pagina/dashboard/compras/cotizaciones/formulario-cotizacion/formulario-cotizacion';
import { ListaOrdenes } from './pagina/dashboard/compras/ordenes/lista-ordenes/lista-ordenes';
import { DetalleOrden } from './pagina/dashboard/compras/ordenes/detalle-orden/detalle-orden';

// Todas las rutas del dashboard exigen sesión (AuthGuard) y un permiso del rol (PermisosGuard)
export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'inicio', component: Inicio },
      { path: 'producto', component: Producto },
      { path: 'nosotros', component: Nosotros },
      { path: 'contacto', component: Contacto },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },

  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: InicioDashboard
      },
      {
        path: 'productos',
        component: ListaProductos,
        canActivate: [PermisosGuard],
        data: { permiso: 'ver_productos' }
      },
      {
        path: 'productos/nuevo',
        component: FormularioProducto,
        canActivate: [PermisosGuard],
        data: { permiso: 'crear_productos' }
      },
      {
        path: 'productos/editar/:id',
        component: FormularioProducto,
        canActivate: [PermisosGuard],
        data: { permiso: 'editar_productos' }
      },
      {
        path: 'inventario/alertas',
        component: StockBajo,
        canActivate: [PermisosGuard],
        data: { permiso: 'ver_alertas_stock' }
      },
      {
        path: 'ventas',
        component: ListaVentas,
        canActivate: [PermisosGuard],
        data: { permiso: 'ver_ventas' }
      },
       {
        path: 'ventas/nuevo',
        component: FormularioVenta,
        canActivate: [PermisosGuard],
        data: { permiso: 'crear_ventas' }
      },
      {
        path: 'ventas/detalle/:id',
        component: DetalleVenta,
        canActivate: [PermisosGuard],
        data: { permiso: 'ver_detalle_ventas' }
      },
      {
        path: 'ventas/devolucion/nuevo',
        component: RegistrarDevolucion,
        canActivate: [PermisosGuard],
        data: { permiso: 'registrar_devoluciones' }
      },
      {
        path: 'compras',
        component: ListaSolicitudes,
        canActivate: [PermisosGuard],
        data: { permiso: 'ver_compras' }
      },
      {
        path: 'compras/nuevo',
        component: FormularioSolicitud,
        canActivate: [PermisosGuard],
        data: { permiso: 'crear_compras' }
      },
      {
        path: 'compras/detalle/:id',
        component: DetalleSolicitud,
        canActivate: [PermisosGuard],
        data: { permiso: 'ver_detalle_compras' }
      },
      {
        path: 'compras/cotizaciones',
        component: ListaCotizaciones,
        canActivate: [PermisosGuard],
        data: { permiso: 'ver_cotizaciones' }
      },
      {
        path: 'compras/cotizaciones/nuevo',
        component: FormularioCotizacion,
        canActivate: [PermisosGuard],
        data: { permiso: 'crear_cotizaciones' }
      },
      {
        path: 'compras/ordenes',
        component: ListaOrdenes,
        canActivate: [PermisosGuard],
        data: { permiso: 'ver_ordenes' }
      },
      {
        path: 'compras/ordenes/detalle/:id',
        component: DetalleOrden,
        canActivate: [PermisosGuard],
        data: { permiso: 'ver_ordenes' }
      },
      {
        path: 'compras/entrega/nuevo',
        component: RegistrarEntrega,
        canActivate: [PermisosGuard],
        data: { permiso: 'registrar_entregas' }
      },
      {
        path: 'clientes',
        component: Clientes,
        canActivate: [PermisosGuard],
        data: { permiso: 'ver_clientes' }
      },
      {
        path: 'clientes/editar/:id',
        component: FormularioCliente,
        canActivate: [PermisosGuard],
        data: { permiso: 'editar_clientes' }
      },
      {
        path: 'clientes/nuevo',
        component: FormularioCliente,
        canActivate: [PermisosGuard],
        data: { permiso: 'crear_clientes' }
      }
    ]
  },

  // Cualquier otra URL vuelve al inicio
  { path: '**', redirectTo: 'inicio' }
];
