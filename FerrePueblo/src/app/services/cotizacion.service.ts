import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CotizacionRequest, CotizacionResponse } from '../models/Cotizacion';

@Injectable({
  providedIn: 'root'
})
export class CotizacionService {

  private apiUrl = 'http://localhost:8080/api/cotizaciones';

  constructor(private http: HttpClient) {}

  listar(): Observable<CotizacionResponse[]> {
    return this.http.get<CotizacionResponse[]>(this.apiUrl);
  }

  buscar(id: number): Observable<CotizacionResponse> {
    return this.http.get<CotizacionResponse>(`${this.apiUrl}/${id}`);
  }

  crear(cotizacion: CotizacionRequest): Observable<CotizacionResponse> {
    return this.http.post<CotizacionResponse>(this.apiUrl, cotizacion);
  }
}
