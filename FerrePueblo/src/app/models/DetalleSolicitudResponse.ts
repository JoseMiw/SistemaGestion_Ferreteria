export interface DetalleSolicitudResponse {
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
        nombres: string;
        apellidos: string;
    };
    detalleSolicitud: DetalleItem[];
}

export interface DetalleItem {
    idDetalleSolicitudCompra: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    producto: {
        idProducto: number;
        codigo?: string;
        nombre: string;
        precioCompra: number;
    };
}