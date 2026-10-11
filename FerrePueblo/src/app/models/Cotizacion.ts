import { ProductoResponse } from './ProductoResponse';
import { Usuario } from './Usuario';

export interface ProveedorResumen {
    idProveedor: number;
    ruc: string;
    nombreProveedor: string;
}

export interface DetalleCotizacion {
    idDetalleCotizacion?: number;
    producto: ProductoResponse;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}

// RF04
export interface CotizacionResponse {
    idCotizacion: number;
    fechaCotizacion: string;
    fechaVigencia: string;
    montoTotal: number;
    estado: 'REGISTRADA' | 'ORDENADA';
    proveedor: ProveedorResumen;
    usuario: Usuario;
    solicitudCompra?: { idSolicitudCompra: number; estado: string } | null;
    detalleCotizacion: DetalleCotizacion[];
}

export interface CotizacionRequest {
    fechaCotizacion: string;
    fechaVigencia: string;
    proveedor: { idProveedor: number };
    solicitudCompra?: { idSolicitudCompra: number };
    detalleCotizacion: {
        producto: { idProducto: number };
        cantidad: number;
        precioUnitario: number;
    }[];
}

// RF05
export interface OrdenCompraResponse {
    idOrdenCompra: number;
    fechaOrden: string;
    montoTotal: number;
    estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'ENTREGADA';
    cotizacion: CotizacionResponse;
    proveedor: ProveedorResumen;
    usuarioCreador: Usuario;
    usuarioAprobador?: Usuario | null;
    fechaAprobacion?: string | null;
}
