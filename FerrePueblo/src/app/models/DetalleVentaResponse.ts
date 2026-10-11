export interface DetalleVentaResponse {
    idVenta?: number;
    fechaVenta: string;
    subtotal: number;
    igv: number;
    total: number;
    tipoComprobante: string;
    cliente: {
        idCliente: number;
        nombres: string;
        apellidos: string;
    };
    usuario: {
        idUsuario: number;
        nombres: string;
        apellidos: string;
        rol: string;
    };
    tipoPago: {
        idTipoPago: number;
        nombreTipo: string;
    };
    detalleVenta: DetalleVentaItem[];
}

export interface DetalleVentaItem {
    idDetalleVenta: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    producto: {
        idProducto: number;
        nombre: string;
        precioVenta: number;
    };
}