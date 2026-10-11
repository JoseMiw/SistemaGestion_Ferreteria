export interface SolicitudResponse {
    idSolicitudCompra?: number;
    fechaCotizacion: string;
    montoTotal: number;
    estado: string;
    proveedor: {
        idProveedor: number;
        nombreProveedor: string;
        ruc: string;
    };
    usuario: {
        idUsuario: number;
        username: string;
        nombres?: string;
        apellidos?: string;
    };
    detalleSolicitud?: DetalleSolicitudItem[];
}

export interface DetalleSolicitudItem {
    idDetalleSolicitudCompra: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    producto: {
        idProducto: number;
        nombre: string;
        precioCompra: number;
    };
}