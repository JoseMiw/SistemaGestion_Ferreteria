import { DetalleVentaResponse } from "./DetalleVentaResponse";

export interface VentaResponse {
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
        nombres?: string;
        apellidos?: string;
        rol: string;  // ← Agregar rol
    };
    tipoPago: {
        idTipoPago: number;
        nombreTipo: string;
    };
    detalleVenta?: DetalleVentaResponse[];
}