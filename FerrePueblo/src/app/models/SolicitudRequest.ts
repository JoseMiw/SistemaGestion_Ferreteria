export interface SolicitudRequest {
    fechaCotizacion: string;
    montoTotal: number;
    proveedor: { idProveedor: number };  // ← Objeto
    usuario: { idUsuario: number };      // ← Objeto
    estado?: string;
    detalleSolicitud: DetalleSolicitudRequest[];
}

export interface DetalleSolicitudRequest {
    producto: { idProducto: number };
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}