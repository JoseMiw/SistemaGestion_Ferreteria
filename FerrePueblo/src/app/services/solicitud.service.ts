import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SolicitudResponse } from '../models/SolicitudResponse';
import { SolicitudRequest } from '../models/SolicitudRequest';
import { DetalleSolicitudResponse } from '../models/DetalleSolicitudResponse';

@Injectable({
  providedIn: 'root'
})
export class SolicitudService {

  private apiUrl = 'http://localhost:8080/api/solicitudes';

  constructor(private http: HttpClient) {}


  listar(): Observable<SolicitudResponse[]> {
    return this.http.get<SolicitudResponse[]>(this.apiUrl);
  }

  // ✅ MÉTODO BUSCAR
  buscar(id: number): Observable<DetalleSolicitudResponse> {
    return this.http.get<DetalleSolicitudResponse>(`${this.apiUrl}/${id}`);
}

  crear(solicitud: SolicitudRequest): Observable<SolicitudResponse> {
    return this.http.post<SolicitudResponse>(this.apiUrl, solicitud);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}