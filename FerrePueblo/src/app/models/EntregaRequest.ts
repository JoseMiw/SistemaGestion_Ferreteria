// La entrega se registra desde una orden de compra APROBADA; el backend
// calcula totales, toma el proveedor de la orden y aumenta el stock.
export interface EntregaRequest {
    idOrdenCompra: number;
    detalleGuia: DetalleGuiaRequest[];
}

export interface DetalleGuiaRequest {
    producto: { idProducto: number };
    cantidad: number;
    costoUnitario: number;
}
