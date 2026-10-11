import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { VentaResponse } from "../models/VentaResponse";
import { VentaRequest } from "../models/VentaRequest";
import { DetalleVentaResponse } from "../models/DetalleVentaResponse";


@Injectable({
    providedIn: 'root'
})
export class VentaService{
    private apiUrl = 'http://localhost:8080/api/ventas';

    constructor(private http: HttpClient) {}

    listar(): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(this.apiUrl);
  }

    buscar(id: number): Observable<DetalleVentaResponse> {
    return this.http.get<DetalleVentaResponse>(`${this.apiUrl}/${id}`);
    }

    crear(venta: VentaRequest): Observable<VentaResponse> {
    return this.http.post<VentaResponse>(this.apiUrl, venta);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}