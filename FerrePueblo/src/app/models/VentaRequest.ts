export interface VentaRequest {
    fechaVenta: string,
    subtotal: number,
    igv: number,
    total: number,
    tipoComprobante: string,
    cliente: { idCliente: number },
    usuario: { idUsuario: number },      
    tipoPago: { idTipoPago: number },
    detalleVenta: DetalleVentaRequest[]
}

export interface DetalleVentaRequest {
    producto: { idProducto: number };
    cantidad: number,
    precioUnitario: number,
    subtotal: number
}