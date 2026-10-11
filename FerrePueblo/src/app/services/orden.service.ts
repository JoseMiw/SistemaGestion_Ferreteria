import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrdenCompraResponse } from '../models/Cotizacion';

@Injectable({
  providedIn: 'root'
})
export class OrdenService {

  private apiUrl = 'http://localhost:8080/api/ordenes';

  constructor(private http: HttpClient) {}

  listar(): Observable<OrdenCompraResponse[]> {
    return this.http.get<OrdenCompraResponse[]>(this.apiUrl);
  }

  buscar(id: number): Observable<OrdenCompraResponse> {
    return this.http.get<OrdenCompraResponse>(`${this.apiUrl}/${id}`);
  }

  crearDesdeCotizacion(idCotizacion: number): Observable<OrdenCompraResponse> {
    return this.http.post<OrdenCompraResponse>(this.apiUrl, { idCotizacion });
  }

  aprobar(id: number): Observable<OrdenCompraResponse> {
    return this.http.put<OrdenCompraResponse>(`${this.apiUrl}/${id}/aprobar`, {});
  }

  rechazar(id: number): Observable<OrdenCompraResponse> {
    return this.http.put<OrdenCompraResponse>(`${this.apiUrl}/${id}/rechazar`, {});
  }
}
