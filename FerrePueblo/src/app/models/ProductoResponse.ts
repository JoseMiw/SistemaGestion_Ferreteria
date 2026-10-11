export interface ProductoResponse{

    idProducto?: number,
    codigo: string,
    nombre: string,
    stock: number,
    stockMinimo: number,
    precioVenta: number,
    precioCompra: number,
    descripcion: string,
    estado: string,
    // Calculado por el backend: NORMAL, BAJO o AGOTADO (RF03)
    estadoStock?: 'NORMAL' | 'BAJO' | 'AGOTADO'

}
