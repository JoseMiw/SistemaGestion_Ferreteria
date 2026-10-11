export interface DevolucionRequest {
    fechaDevolucion: string;
    motivo: string;
    idVenta: number;
    idUsuario: number;
    detalleDevolucion: DetalleDevolucionRequest[];
    nuevoProducto?: {           // ← NUEVO: producto para cambio
        idProducto: number;
        cantidad: number;
    };
}

export interface DetalleDevolucionRequest {
    producto: { idProducto: number };  // ← Objeto, igual que DetalleDevolucion en el backend
    cantidad: number;
    motivo: string;
}